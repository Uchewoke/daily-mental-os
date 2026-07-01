// lib/weekly-synthesis-job.ts
// Shared logic for generating + storing + emailing weekly syntheses (Prompt 3)
// for every user who checked in during the past week. Invoked by both the
// GET cron route (app/api/cron/weekly-synthesis) and the manual POST trigger
// (app/api/mood/weekly-synthesis) for local testing.

import { generateWeeklySynthesis } from "./claude";
import { sendWeeklySynthesisEmail } from "./email";
import { getSupabaseAdmin } from "./supabase-admin";
import { getCheckInsSince, startOfWeekUTC } from "./check-ins";

export interface WeeklySynthesisJobResult {
  userId: string;
  stored: boolean;
  emailed: boolean;
  error?: string;
}

export async function runWeeklySynthesisJob(): Promise<WeeklySynthesisJobResult[]> {
  const supabase = getSupabaseAdmin();
  const weekStart = startOfWeekUTC();
  const sinceISO = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentCheckIns, error: fetchError } = await supabase
    .from("check_ins")
    .select("user_id")
    .gte("created_at", sinceISO);

  if (fetchError) throw new Error(fetchError.message);

  const userIds = [...new Set((recentCheckIns || []).map((r) => r.user_id as string))];
  const results: WeeklySynthesisJobResult[] = [];

  for (const userId of userIds) {
    try {
      const checkIns = await getCheckInsSince(userId, sinceISO);
      if (checkIns.length === 0) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userName = (userData?.user?.user_metadata?.name as string) || "there";
      const userEmail = userData?.user?.email;

      const synthesis = await generateWeeklySynthesis(
        checkIns.map((c) => ({
          moodScore: c.mood_score,
          energyLevel: c.energy_level,
          stressLevel: c.stress_level,
          journalEntry: c.journal_entry,
          createdAt: c.created_at,
        })),
        userName
      );

      const weekStartDate = weekStart.toISOString().slice(0, 10);
      const { error: upsertError } = await supabase.from("weekly_syntheses").upsert(
        {
          user_id: userId,
          week_start: weekStartDate,
          subject: synthesis.subject,
          body: synthesis.body,
        },
        { onConflict: "user_id,week_start" }
      );
      if (upsertError) throw new Error(upsertError.message);

      let emailed = false;
      if (userEmail) {
        const emailResult = await sendWeeklySynthesisEmail({
          to: userEmail,
          subject: synthesis.subject,
          body: synthesis.body,
        });
        emailed = emailResult.sent;
        if (emailResult.sent) {
          await supabase
            .from("weekly_syntheses")
            .update({ emailed_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("week_start", weekStartDate);
        }
      }

      results.push({ userId, stored: true, emailed });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[weekly-synthesis] failed for user ${userId}:`, err);
      results.push({ userId, stored: false, emailed: false, error: message });
    }
  }

  return results;
}
