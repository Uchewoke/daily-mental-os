import Link from "next/link";
import { ArrowLeft, Mail, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { CRISIS_RESOURCES } from "@/lib/claude";

export const metadata: Metadata = {
  title: "Contact — Daily Mental OS",
};

const SUPPORT_EMAIL = "myalongside@gmail.com";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition mb-10">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold mb-3">Contact us</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">
          Questions about your account, billing, a bug you ran into, or feedback on the coaching itself —
          we read every message.
        </p>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center gap-4 bg-slate-800/50 border border-slate-700 hover:border-slate-500 rounded-2xl p-6 mb-10 transition"
        >
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
            <Mail className="text-blue-400" size={22} />
          </div>
          <div>
            <p className="text-white font-medium">Email support</p>
            <p className="text-slate-400 text-sm">{SUPPORT_EMAIL}</p>
          </div>
        </a>

        <div className="flex items-start gap-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <ShieldAlert className="text-red-400 mt-1 shrink-0" size={22} />
          <div>
            <p className="text-white font-medium mb-2">In a mental health crisis?</p>
            <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
              This inbox isn&apos;t monitored 24/7 and Daily Mental OS isn&apos;t a crisis service. If you need
              immediate support, please reach out here instead:
            </p>
            <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed mt-2">
              {CRISIS_RESOURCES}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
