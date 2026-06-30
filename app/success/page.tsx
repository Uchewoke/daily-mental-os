import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">You&apos;re all set!</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Your subscription is active. You now have unlimited daily AI coaching, pattern detection, and weekly synthesis.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition"
        >
          <Zap size={18} />
          Start your first check-in
        </Link>
      </div>
    </div>
  );
}
