// lib/email.ts
// Thin wrapper around Resend for the weekly synthesis email (Prompt 3).
// If RESEND_API_KEY isn't set, sends are skipped (logged) rather than failing —
// the synthesis is still generated and stored for in-app viewing either way.

import { Resend } from "resend";

const FROM_ADDRESS = process.env.WEEKLY_SYNTHESIS_FROM_EMAIL || "coach@dailymentalos.app";

export async function sendWeeklySynthesisEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping weekly synthesis email send (synthesis was still saved)."
    );
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    text: params.body,
  });

  if (error) {
    console.error("[email] Resend send error:", error);
    return { sent: false, reason: error.message };
  }

  return { sent: true };
}
