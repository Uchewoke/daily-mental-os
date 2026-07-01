// lib/check-ins.ts
// Persistence + historical-analysis helpers backing Prompts 2, 4, and 6
// (pattern detection, pattern-aware coaching, breakthrough detection).
// Requires the `check_ins` table from supabase/migrations/20260701000000_check_ins_and_synthesis.sql

import { getSupabaseAdmin } from "./supabase-admin";

export interface CheckInRow {
  id: string;
  user_id: string;
  created_at: string;
  mood_score: number;
  energy_level: number;
  stress_level: number;
  journal_entry: string | null;
  insight: string | null;
  root_cause: string | null;
  micro_intervention: string | null;
  pattern_detected: string;
  is_crisis: boolean;
  is_breakthrough: boolean;
}

export interface NewCheckIn {
  userId: string;
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  journalEntry?: string;
  insight?: string;
  rootCause?: string;
  microIntervention?: string;
  patternDetected?: string;
  isCrisis?: boolean;
  isBreakthrough?: boolean;
}

export async function insertCheckIn(data: NewCheckIn): Promise<CheckInRow> {
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("check_ins")
    .insert({
      user_id: data.userId,
      mood_score: data.moodScore,
      energy_level: data.energyLevel,
      stress_level: data.stressLevel,
      journal_entry: data.journalEntry || null,
      insight: data.insight || null,
      root_cause: data.rootCause || null,
      micro_intervention: data.microIntervention || null,
      pattern_detected: data.patternDetected || "none",
      is_crisis: data.isCrisis || false,
      is_breakthrough: data.isBreakthrough || false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save check-in: ${error.message}`);
  return row as CheckInRow;
}

export async function getRecentCheckIns(
  userId: string,
  limit = 5
): Promise<CheckInRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to load check-ins: ${error.message}`);
  return (data as CheckInRow[]) || [];
}

export async function getCheckInsSince(
  userId: string,
  sinceISO: string
): Promise<CheckInRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load check-ins: ${error.message}`);
  return (data as CheckInRow[]) || [];
}

/** Monday 00:00:00 UTC of the week containing `date`. */
export function startOfWeekUTC(date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d;
}

export async function getCheckInCountThisWeek(userId: string): Promise<number> {
  const rows = await getCheckInsSince(userId, startOfWeekUTC().toISOString());
  return rows.length;
}

/**
 * Prompt 6 (breakthrough detection): mood jumped 3+ points versus the recent
 * low, using up to the last 5 prior check-ins (most recent first, excludes the
 * current one being scored).
 */
export function detectBreakthrough(
  currentMood: number,
  priorRows: CheckInRow[]
): boolean {
  if (priorRows.length === 0) return false;
  const recentLow = Math.min(...priorRows.slice(0, 5).map((r) => r.mood_score));
  return currentMood - recentLow >= 3;
}

export interface PatternHistoryContext {
  dominantPattern: string | null;
  occurrences: number;
  pastWorkingSolution: string | null;
}

/**
 * Prompt 4 (pattern-aware coaching): finds the most frequent recurring
 * pattern in a user's history, and the most recent time a micro-intervention
 * for that pattern was followed by a real mood improvement (>=2 points) on
 * the next check-in — i.e. "what worked before."
 */
export function getPatternHistoryContext(
  rows: CheckInRow[]
): PatternHistoryContext {
  // rows expected oldest -> newest for the "what worked" scan to make sense.
  const chronological = [...rows].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const counts = new Map<string, number>();
  for (const row of chronological) {
    if (row.pattern_detected && row.pattern_detected !== "none") {
      counts.set(row.pattern_detected, (counts.get(row.pattern_detected) || 0) + 1);
    }
  }

  let dominantPattern: string | null = null;
  let occurrences = 0;
  for (const [pattern, count] of counts) {
    if (count > occurrences) {
      dominantPattern = pattern;
      occurrences = count;
    }
  }

  if (!dominantPattern || occurrences < 2) {
    return { dominantPattern: null, occurrences: 0, pastWorkingSolution: null };
  }

  let pastWorkingSolution: string | null = null;
  for (let i = 0; i < chronological.length - 1; i++) {
    const row = chronological[i];
    const next = chronological[i + 1];
    if (
      row.pattern_detected === dominantPattern &&
      row.micro_intervention &&
      next.mood_score - row.mood_score >= 2
    ) {
      pastWorkingSolution = row.micro_intervention;
    }
  }

  return { dominantPattern, occurrences, pastWorkingSolution };
}
