'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Zap, Brain } from 'lucide-react';

const PLUS_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID!;
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;

async function startCheckout(priceId: string, setLoading: (id: string | null) => void) {
  setLoading(priceId);
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.message || 'Could not start checkout');
      setLoading(null);
    }
  } catch {
    alert('Something went wrong. Please try again.');
    setLoading(null);
  }
}

export default function PlansPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Brain size={24} className="text-blue-400" />
          Daily Mental OS
        </Link>
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition">
          Back to dashboard
        </Link>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold mb-3">Choose your plan</h1>
        <p className="text-slate-400 text-lg mb-14">Start free. Upgrade when you want more coaching.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

          {/* Free */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <h3 className="text-white font-bold text-xl mb-1">Free</h3>
            <p className="text-slate-400 text-sm mb-6">Forever free</p>
            <p className="text-4xl font-bold text-white mb-8">$0</p>
            <ul className="flex flex-col gap-3 mb-8">
              {['3 AI check-ins per week', 'Real-time mood insights', 'Pattern detection'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="block text-center border border-slate-600 hover:border-slate-400 text-white font-medium px-6 py-3 rounded-xl transition"
            >
              Current plan
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
                'Unlimited daily check-ins',
                'Weekly AI synthesis report',
                'Advanced pattern library',
                'Mood trend charts',
                'Priority support',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle size={16} className="text-blue-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => startCheckout(PLUS_PRICE_ID, setLoadingId)}
              disabled={loadingId !== null}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loadingId === PLUS_PRICE_ID ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirecting...</>
              ) : (
                <><Zap size={16} /> Upgrade to Plus</>
              )}
            </button>
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
                'Everything in Plus',
                'Daily AI coaching sessions',
                'Multi-profile support',
                'Data export (CSV / PDF)',
                'Early access to new features',
                '1-on-1 onboarding call',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                  <CheckCircle size={16} className="text-purple-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => startCheckout(PRO_PRICE_ID, setLoadingId)}
              disabled={loadingId !== null}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loadingId === PRO_PRICE_ID ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirecting...</>
              ) : (
                <><Zap size={16} /> Upgrade to Pro</>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
