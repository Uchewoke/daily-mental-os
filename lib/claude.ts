// lib/claude.ts

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MoodCheckIn {
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  journalEntry?: string;
  userName?: string;
}

interface MoodAnalysis {
  insight: string;
  coachingTip: string;
  patternDetected: string;
}

/**
 * Analyzes a mood check-in and returns personalized coaching
 * Uses Claude Sonnet 4.6 for fast, cost-effective responses
 */
export async function analyzeMood(checkIn: MoodCheckIn): Promise<MoodAnalysis> {
  const systemPrompt = `You are an empathetic AI wellness coach specializing in helping creators and professionals manage stress and mental health. You provide specific, actionable coaching without being generic or clichéd.

Key traits:
- Warm and genuinely caring, but direct
- Specific to the person's actual situation, not generic wellness platitudes
- Focus on evidence-based techniques (CBT, grounding, etc.)
- Identify emotional patterns (perfectionism spirals, burnout risk, imposter syndrome, etc.)
- Keep coaching tips under 50 words
- Avoid using phrases like "remember to take care of yourself" or "prioritize self-care"`;

  const userPrompt = `Analyze this daily check-in:

Mood Score: ${checkIn.moodScore}/10
Energy Level: ${checkIn.energyLevel}/10
Stress Level: ${checkIn.stressLevel}/10
${checkIn.journalEntry ? `Notes: "${checkIn.journalEntry}"` : ""}

${checkIn.userName ? `User's name: ${checkIn.userName}` : ""}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "insight": "2-3 sentence psychological insight about their current state. Be specific to their data.",
  "coachingTip": "One actionable technique they can use right now (under 50 words). Be specific and non-generic.",
  "patternDetected": "Pattern name if applicable (perfectionism_spiral, burnout_risk, rumination_loop, imposter_syndrome, decision_paralysis, none). Use snake_case."
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON response
    const parsed = JSON.parse(responseText);

    return {
      insight: parsed.insight || "",
      coachingTip: parsed.coachingTip || "",
      patternDetected: parsed.patternDetected || "none",
    };
  } catch (error) {
    console.error("Claude API error:", error);
    throw new Error("Failed to generate coaching insight");
  }
}

/**
 * Generates a weekly synthesis from multiple check-ins
 * Shows patterns, trends, and breakthrough insights
 */
export async function generateWeeklySynthesis(
  checkIns: MoodCheckIn[],
  userName: string
): Promise<string> {
  const systemPrompt = `You are an insightful AI wellness coach generating weekly mental health synthesis for creators. Your goal is to identify patterns, celebrate progress, and suggest one powerful practice for the week ahead.`;

  const checkInSummary = checkIns
    .map(
      (c, i) =>
        `Day ${i + 1}: Mood ${c.moodScore}/10, Energy ${c.energyLevel}/10, Stress ${c.stressLevel}/10. ${c.journalEntry || "No notes."}`
    )
    .join("\n");

  const userPrompt = `Generate a weekly synthesis for ${userName} based on these check-ins:

${checkInSummary}

Provide exactly this structure:
**This Week's Trend**
[1-2 sentences about the overall pattern]

**Key Breakthrough**
[2-3 sentences of a specific insight about their week]

**One Practice to Try**
[1 actionable technique specific to their data and patterns]`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Claude synthesis error:", error);
    throw new Error("Failed to generate weekly synthesis");
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
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Claude content error:", error);
    return "Your personal AI wellness coach";
  }
}