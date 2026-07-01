import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Daily Mental OS",
};

const SUPPORT_EMAIL = "myalongside@gmail.com";
const LAST_UPDATED = "July 1, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
      <div className="text-slate-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition mb-10">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <Section title="What we collect">
          <p>When you use Daily Mental OS, we collect:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Account info: your email address and, optionally, your name.</li>
            <li>Check-in data: your mood, energy, and stress scores, and any journal notes you write.</li>
            <li>Usage data: check-in timestamps and coaching insights generated for you, so we can show pattern history and weekly synthesis.</li>
            <li>Billing data: if you subscribe to Plus or Pro, Stripe processes your payment details directly — we never see or store your full card number.</li>
          </ul>
        </Section>

        <Section title="How we use it">
          <p>
            Your check-in data is sent to Anthropic&apos;s Claude API to generate your real-time coaching
            insight, detect patterns across your history, and produce your weekly synthesis. We use it for
            no purpose beyond providing you the coaching features you signed up for — we do not sell your
            data, and we do not use your journal entries for advertising.
          </p>
        </Section>

        <Section title="Who we share it with">
          <ul className="list-disc list-inside space-y-1">
            <li><span className="font-medium text-slate-200">Anthropic</span> — processes your check-in text to generate coaching responses.</li>
            <li><span className="font-medium text-slate-200">Supabase</span> — hosts our database and handles authentication.</li>
            <li><span className="font-medium text-slate-200">Stripe</span> — processes subscription payments.</li>
            <li><span className="font-medium text-slate-200">Resend</span> — delivers your weekly synthesis email, if you have one enabled.</li>
          </ul>
          <p>We don&apos;t share your data with anyone else, and none of these providers are permitted to use your data for their own purposes.</p>
        </Section>

        <Section title="Crisis detection">
          <p>
            If a check-in shows signs of crisis, we surface crisis-line resources (like the 988 Suicide &amp;
            Crisis Lifeline) directly in the app. Daily Mental OS is not a crisis service, a medical device,
            or a substitute for professional mental health care — it&apos;s an AI coaching tool. If you or someone
            you know is in immediate danger, please contact emergency services directly.
          </p>
        </Section>

        <Section title="Data retention & deletion">
          <p>
            We keep your check-in history so we can detect patterns and generate your weekly synthesis. You
            can request deletion of your account and all associated data at any time by emailing{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400 hover:text-blue-300 underline">
              {SUPPORT_EMAIL}
            </a>. We&apos;ll delete your data within 30 days of your request.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Your data is stored in Supabase with row-level security, meaning only your account can read your
            own check-ins. Passwords are never stored in plaintext. Sessions are managed via signed, httpOnly
            cookies.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes to how we handle your data, we&apos;ll update this page and, where
            required, notify you by email.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions about this policy or your data? Reach out at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-400 hover:text-blue-300 underline">
              {SUPPORT_EMAIL}
            </a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
