import Link from "next/link";
import { Brain, TrendingUp, Zap, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { generateMicroContent } from "@/lib/claude";

export default async function LandingPage() {
  let hookLine =
    "Stop guessing how you feel — let AI turn your daily check-in into a coaching session.";
  try {
    hookLine = await generateMicroContent();
  } catch {
    // use fallback above
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">Daily Mental OS</span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-slate-400 hover:text-white text-sm transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-8">
          <Sparkles size={14} />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          Your brain deserves
          <span className="text-blue-400"> a daily OS</span>
        </h1>

        {/* Live Claude-generated hook */}
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {hookLine}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition"
          >
            Start your first check-in
            <ArrowRight size={20} />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-medium px-8 py-4 rounded-xl text-lg transition"
          >
            See how it works
          </a>
        </div>

        {/* Social proof numbers */}
        <div className="flex flex-col sm:flex-row justify-center gap-12 mt-16 text-center">
          {[
            { value: "2 min", label: "average check-in time" },
            { value: "3 patterns", label: "detected per week on avg" },
            { value: "Free", label: "to start — no card needed" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-slate-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Not a mood tracker. A mental performance system.
        </h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          Every check-in feeds Claude AI a snapshot of your mental state — and it responds like a coach who actually read your data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Brain size={28} className="text-blue-400" />,
              title: "Real-time AI insight",
              desc: "After each check-in, Claude analyzes your mood, energy, and stress scores alongside your journal notes and surfaces a psychological insight specific to your pattern — not a generic tip.",
            },
            {
              icon: <TrendingUp size={28} className="text-emerald-400" />,
              title: "Pattern detection",
              desc: "Claude flags burnout risk, perfectionism spirals, rumination loops, and imposter syndrome before they derail you — named patterns you can recognize and act on.",
            },
            {
              icon: <Zap size={28} className="text-amber-400" />,
              title: "Weekly synthesis",
              desc: "Every week Claude reviews your full check-in history and delivers a synthesis: your trend, one breakthrough insight, and one high-leverage practice tailored to your data.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-slate-500 transition"
            >
              <div className="mb-4">{icon}</div>
              <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">How it works</h2>
        <div className="flex flex-col gap-10">
          {[
            {
              step: "01",
              title: "Log your check-in",
              desc: "Rate your mood, energy, and stress on a 1–10 scale. Add optional journal notes — what happened, what's on your mind.",
            },
            {
              step: "02",
              title: "Claude reads your data",
              desc: "The AI analyzes your scores and notes in context, using CBT and evidence-based frameworks to understand what you're experiencing.",
            },
            {
              step: "03",
              title: "Get your coaching",
              desc: "Receive a specific insight, an actionable technique for right now, and a named pattern if one is detected — all in under 10 seconds.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-6 items-start">
              <span className="text-4xl font-bold text-slate-700 w-14 shrink-0">{step}</span>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-slate-400 text-center mb-14">Start free. Upgrade when you want more.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <h3 className="text-white font-bold text-xl mb-1">Free</h3>
            <p className="text-slate-400 text-sm mb-6">Forever free</p>
            <p className="text-4xl font-bold text-white mb-8">$0</p>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                "3 AI check-ins per week",
                "Real-time mood insights",
                "Pattern detection",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center border border-slate-600 hover:border-slate-400 text-white font-medium px-6 py-3 rounded-xl transition"
            >
              Get started free
            </Link>
          </div>

          {/* Plus */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/40 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Popular
            </div>
            <h3 className="text-white font-bold text-xl mb-1">Plus</h3>
            <p className="text-slate-400 text-sm mb-6">For daily coaching</p>
            <p className="text-4xl font-bold text-white mb-8">
              $9.99<span className="text-lg font-normal text-slate-400">/mo</span>
            </p>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                "Unlimited daily check-ins",
                "Weekly AI synthesis report",
                "Advanced pattern library",
                "Mood trend charts",
                "Priority support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle size={16} className="text-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Upgrade to Plus
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/40 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Best value
            </div>
            <h3 className="text-white font-bold text-xl mb-1">Pro</h3>
            <p className="text-slate-400 text-sm mb-6">For high performers</p>
            <p className="text-4xl font-bold text-white mb-8">
              $14.99<span className="text-lg font-normal text-slate-400">/mo</span>
            </p>
            <ul className="flex flex-col gap-3 mb-8">
              {[
                "Everything in Plus",
                "Daily AI coaching sessions",
                "Multi-profile support",
                "Data export (CSV / PDF)",
                "Early access to new features",
                "1-on-1 onboarding call",
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle size={16} className="text-purple-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">Start in 60 seconds.</h2>
        <p className="text-slate-400 text-lg mb-8">
          No credit card. No fluff. Just your first AI-powered check-in.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-4 rounded-xl text-lg transition"
        >
          Try it free
          <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <span>© 2026 Daily Mental OS</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition">Terms</a>
            <a href="mailto:cheuche87@gmail.com" className="hover:text-slate-300 transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
