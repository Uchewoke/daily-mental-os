// lib/claude.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

export const CRISIS_RESOURCES = `Crisis Text Line: Text HOME to 741741
National Suicide Prevention Lifeline: 988
International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

If you're in immediate danger, call emergency services (911 in the US).`;

// Fast, deterministic pre-check for the most explicit crisis signals (Prompt 5).
// This runs before any LLM call so the most severe cases never depend on model
// judgment or network latency — a keyword hit always wins.
const CRISIS_KEYWORD_PATTERNS: RegExp[] = [
  /\bkill(ing)?\s+myself\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+(my\s+life|it\s+all)\b/i,
  /\bself[\s-]?harm\b/i,
  /\bcutting\s+myself\b/i,
  /\bwant(ed)?\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(be\s+alive|live\s+anymore|exist)\b/i,
  /\bcan'?t\s+do\s+this\s+anymore\b/i,
  /\bno\s+reason\s+to\s+(live|go\s+on)\b/i,
];

export function checkCrisisKeywords(text: string | undefined): boolean {
  if (!text) return false;
  return CRISIS_KEYWORD_PATTERNS.some((pattern) => pattern.test(text));
}

interface PatternContext {
  dominantPattern: string | null;
  pastWorkingSolution: string | null;
}

interface MoodCheckIn {
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  journalEntry?: string;
  userName?: string;
  patternContext?: PatternContext;
  isBreakthrough?: boolean;
}

export interface MoodAnalysis {
  insight: string;
  rootCause: string;
  microIntervention: string;
  patternDetected: string;
  isCrisis: boolean;
  crisisMessage: string;
  isBreakthrough: boolean;
}

// Prompt 1 (+ Prompt 4 pattern-aware coaching, + Prompt 5 crisis flag,
// + Prompt 6 breakthrough framing) combined into a single call: these are all
// facets of the same real-time check-in response, and folding them together
// keeps this to one Claude round-trip per check-in instead of three.
function buildMoodPrompts(checkIn: MoodCheckIn) {
  const systemPrompt = `You are an insightful AI coach for creators and professionals. Detect what's ACTUALLY happening psychologically (not the surface-level symptom) and give ONE specific micro-intervention the user can do in the next 5-30 minutes.

SAFETY FIRST: If the check-in shows signs of crisis — hopelessness ("nothing matters"), any mention of self-harm or suicide, "can't do this anymore" paired with very low mood, or prolonged isolation plus low mood — set "isCrisis": true and let "crisisMessage" carry compassionate, direct language pointing to real crisis resources. When isCrisis is true, coaching fields should still be filled but are secondary to the crisis message. Err on the side of caution: if there is any doubt, set isCrisis to true.

STRICT RULES:
- NO generic wellness advice (no "meditate," "take a walk," "practice gratitude," "prioritize self-care")
- NO platitudes ("remember to take care of yourself," "you've got this")
- Be specific to the actual data given, not a generic template
- Be actionable: the user should know exactly what to do next
- Be brief: total non-crisis response under 150 words across all fields`;

  const patternLines: string[] = [];
  if (checkIn.patternContext?.dominantPattern) {
    patternLines.push(
      `This user has a recurring pattern: ${checkIn.patternContext.dominantPattern}.`
    );
    if (checkIn.patternContext.pastWorkingSolution) {
      patternLines.push(
        `Something that worked for them before with this pattern: "${checkIn.patternContext.pastWorkingSolution}". If it's relevant today, reference it directly (e.g. "Remember when you tried X? Do that again") instead of inventing something generic.`
      );
    }
  }
  const isBreakthrough = Boolean(checkIn.isBreakthrough);
  if (isBreakthrough) {
    patternLines.push(
      `Their mood just jumped sharply compared to their recent low — this IS a breakthrough moment. Frame the insight as a genuine celebration of what specifically changed, and tell them how to keep the momentum, rather than standard analysis. Set "isBreakthrough": true in your response.`
    );
  }

  const userPrompt = `Analyze this check-in:

Mood Score: ${checkIn.moodScore}/10
Energy Level: ${checkIn.energyLevel}/10
Stress Level: ${checkIn.stressLevel}/10
${checkIn.journalEntry ? `Journal: "${checkIn.journalEntry}"` : "No journal entry."}
${checkIn.userName ? `User's name: ${checkIn.userName}` : ""}
${patternLines.length ? `\n${patternLines.join("\n")}` : ""}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "insight": "2-3 sentence psychological insight specific to this data",
  "rootCause": "What's ACTUALLY happening (e.g. perfectionism, burnout, isolation, comparison, imposter_syndrome) in plain language",
  "microIntervention": "One specific 5-30 min technique they can do right now",
  "patternDetected": "snake_case pattern name (perfectionism_spiral, burnout_risk, isolation_anxiety, comparison_spiral, decision_paralysis, overcommitment, imposter_syndrome, emotional_exhaustion, none)",
  "isCrisis": false,
  "crisisMessage": "",
  "isBreakthrough": ${isBreakthrough}
}`;

  return { systemPrompt, userPrompt };
}

function isOverloadedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("overloaded_error") || msg.includes("Overloaded");
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function streamMoodAnalysis(
  checkIn: MoodCheckIn,
  onComplete?: (fullText: string) => void
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { systemPrompt, userPrompt } = buildMoodPrompts(checkIn);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        let fullText = "";
        try {
          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: 500,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          });

          stream.on("text", (delta) => {
            fullText += delta;
            controller.enqueue(encoder.encode(delta));
          });

          await stream.finalMessage();
          controller.close();
          onComplete?.(fullText);
          return;
        } catch (error) {
          if (isOverloadedError(error) && attempt < maxRetries - 1) {
            await sleep(1500 * (attempt + 1));
            continue;
          }
          controller.error(error);
          return;
        }
      }
    },
  });
}

function parseMoodAnalysis(responseText: string): MoodAnalysis {
  const cleaned = responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  const isCrisis = Boolean(parsed.isCrisis);

  return {
    insight: parsed.insight || "",
    rootCause: parsed.rootCause || "",
    microIntervention: parsed.microIntervention || "",
    patternDetected: parsed.patternDetected || "none",
    isCrisis,
    crisisMessage: isCrisis
      ? parsed.crisisMessage ||
        `I'm concerned about what you shared. This isn't something an app can help with — please reach out to someone today.\n\n${CRISIS_RESOURCES}`
      : "",
    isBreakthrough: Boolean(parsed.isBreakthrough),
  };
}

export async function analyzeMood(checkIn: MoodCheckIn): Promise<MoodAnalysis> {
  const { systemPrompt, userPrompt } = buildMoodPrompts(checkIn);

  let responseText = "";
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    responseText = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Claude API error:", error);
    throw new Error("Failed to generate coaching insight");
  }

  try {
    return parseMoodAnalysis(responseText);
  } catch (error) {
    console.error("JSON parse error. Raw response:", responseText);
    throw new Error("Failed to parse coaching insight response");
  }
}

/** Parses the full JSON out of an already-streamed response (server-side, post-stream). */
export function parseStreamedMoodAnalysis(fullText: string): MoodAnalysis {
  return parseMoodAnalysis(fullText);
}

export interface CheckInSummary {
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  journalEntry?: string | null;
  createdAt: string;
}

export interface PatternDetectionResult {
  pattern: string;
  evidence: string;
  rootCause: string;
  solution: string;
  experimentToTry: string;
}

// Prompt 2: pattern detection across a user's check-in history (fires once
// they have 3+ check-ins). Non-streaming — this isn't a real-time response.
export async function detectPatterns(
  checkIns: CheckInSummary[]
): Promise<PatternDetectionResult | null> {
  if (checkIns.length < 3) return null;

  const systemPrompt = `You are an AI pattern detection coach. After seeing multiple check-ins, you notice patterns the user can't see alone — time-based, behavior-based, sleep/energy-based, social, stress-trigger, or perfectionism patterns. Only report a pattern with real supporting evidence from the data; don't force one if it isn't there.`;

  const checkInLines = checkIns
    .map((c, i) => {
      const day = new Date(c.createdAt).toLocaleDateString("en-US", { weekday: "long" });
      return `${day} (check-in ${i + 1}): Mood ${c.moodScore}/10, Energy ${c.energyLevel}/10, Stress ${c.stressLevel}/10${c.journalEntry ? `, Notes: "${c.journalEntry}"` : ""}`;
    })
    .join("\n");

  const userPrompt = `Check-in history (chronological):
${checkInLines}

Find 1-2 strong, evidence-backed patterns and the correlation behind them (what predicts the mood/energy/stress swings?). If there is genuinely no clear pattern yet, respond with "pattern": "none".

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "pattern": "Pattern name, e.g. 'Thursday Stress Spike', or 'none'",
  "evidence": "The specific data points that show this pattern",
  "rootCause": "Why this pattern likely exists",
  "solution": "A specific, concrete fix",
  "experimentToTry": "A one-week A/B test the user can run to confirm the fix works"
}`;

  let responseText = "";
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    responseText = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Claude pattern detection error:", error);
    throw new Error("Failed to detect patterns");
  }

  try {
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.pattern || parsed.pattern === "none") return null;

    return {
      pattern: parsed.pattern,
      evidence: parsed.evidence || "",
      rootCause: parsed.rootCause || "",
      solution: parsed.solution || "",
      experimentToTry: parsed.experimentToTry || "",
    };
  } catch (error) {
    console.error("JSON parse error. Raw response:", responseText);
    throw new Error("Failed to parse pattern detection response");
  }
}

export interface WeeklySynthesis {
  subject: string;
  body: string;
}

// Prompt 3: weekly synthesis email. Background job, not real-time.
export async function generateWeeklySynthesis(
  checkIns: CheckInSummary[],
  userName: string
): Promise<WeeklySynthesis> {
  const systemPrompt = `You are a thoughtful AI coach providing a weekly synthesis for a creator or professional. Warm but direct, specific to their actual data (never generic), actionable, hopeful but realistic. Celebrate real wins, show the data-driven pattern you noticed, and give exactly one powerful practice to try next week.`;

  const checkInSummary = checkIns
    .map(
      (c, i) =>
        `Day ${i + 1}: Mood ${c.moodScore}/10, Energy ${c.energyLevel}/10, Stress ${c.stressLevel}/10.${c.journalEntry ? ` Notes: "${c.journalEntry}"` : ""}`
    )
    .join("\n");

  const userPrompt = `Generate a weekly synthesis for ${userName} based on these check-ins:

${checkInSummary}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "subject": "Short, specific email subject line (not generic, e.g. 'You're in a Perfectionism Spiral (And How to Break It)')",
  "body": "The email body in this exact structure with these exact headings:\\n\\nHi ${userName},\\n\\nThis Week's Trend:\\n[1-2 sentences on the overall trajectory]\\n\\nThe Pattern:\\n[2-3 sentences with data-driven insight]\\n\\nWhat You Should Try Next Week:\\n[ONE specific actionable thing]\\n\\nKeep checking in. You're building real self-awareness.\\n— Your AI Coach"
}`;

  let responseText = "";
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    responseText = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Claude synthesis error:", error);
    throw new Error("Failed to generate weekly synthesis");
  }

  try {
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject || "Your Weekly Insight",
      body: parsed.body || "",
    };
  } catch (error) {
    console.error("JSON parse error. Raw response:", responseText);
    throw new Error("Failed to parse weekly synthesis response");
  }
}

/**
 * Generates personalized wellness micro-content for the landing page
 */
export async function generateMicroContent(): Promise<string> {
  const systemPrompt = `You are a copywriter for a wellness app. Write compelling, concise copy that resonates with creators and professionals.`;

  const userPrompt = `Write a 1-sentence hook about daily AI mental health coaching for a landing page. Make it specific and avoid generic wellness language.`;

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Claude content error:", error);
    return "Your personal AI wellness coach";
  }
}
