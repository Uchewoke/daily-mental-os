'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Zap, ShieldAlert, TrendingUp, Sparkles, Mail } from 'lucide-react';

const PLUS_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID!;

function extractStreamingInsight(text: string): string {
  const match = text.match(/"insight"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (!match) return '';
  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

interface PatternResult {
  pattern: string;
  evidence: string;
  rootCause: string;
  solution: string;
  experimentToTry: string;
}

interface WeeklySynthesis {
  subject: string;
  body: string;
  week_start: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [userPlan, setUserPlan] = useState('free');
  const [checkinsThisWeek, setCheckinsThisWeek] = useState(0);
  const [streamingText, setStreamingText] = useState('');
  const [pattern, setPattern] = useState<PatternResult | null>(null);
  const [weeklySynthesis, setWeeklySynthesis] = useState<WeeklySynthesis | null>(null);
  const [showWeekly, setShowWeekly] = useState(false);

  const [form, setForm] = useState({
    moodScore: 5,
    energyLevel: 5,
    stressLevel: 5,
    journalEntry: ''
  });

  const [response, setResponse] = useState({
    insight: '',
    rootCause: '',
    microIntervention: '',
    patternDetected: '',
    isCrisis: false,
    crisisMessage: '',
    isBreakthrough: false,
  });

  const FREE_LIMIT = 3;
  const isFreemiumLimited = userPlan === 'free' && checkinsThisWeek >= FREE_LIMIT;

  // Fetch user data on mount
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch('/api/user/plan');
        const data = await res.json();
        setUserPlan(data.plan);
        setCheckinsThisWeek(data.checkinsThisWeek);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    }
    async function loadWeeklySynthesis() {
      try {
        const res = await fetch('/api/mood/weekly-synthesis');
        const data = await res.json();
        setWeeklySynthesis(data.synthesis || null);
      } catch (err) {
        console.error('Failed to load weekly synthesis:', err);
      }
    }
    loadUserData();
    loadWeeklySynthesis();
  }, []);

  async function handleUpgrade(priceId: string) {
    setUpgrading(true);
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
        setError(data.message || 'Could not start checkout');
        setUpgrading(false);
      }
    } catch {
      setError('Checkout failed. Please try again.');
      setUpgrading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isFreemiumLimited) {
      setError(`Free users can only check in ${FREE_LIMIT}x per week. Upgrade to Plus for unlimited.`);
      return;
    }

    setLoading(true);
    setError('');
    setStreamingText('');

    try {
      const res = await fetch('/api/mood/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingText(accumulated);
      }
      // Flush any remaining bytes held by the decoder
      accumulated += decoder.decode();

      const cleaned = accumulated
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      let parsed: {
        insight?: string;
        rootCause?: string;
        microIntervention?: string;
        patternDetected?: string;
        isCrisis?: boolean;
        crisisMessage?: string;
        isBreakthrough?: boolean;
      } = {};
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error('JSON parse failed. Raw response:', cleaned);
        throw new Error('Could not parse coaching response. Please try again.');
      }

      setResponse({
        insight: parsed.insight || '',
        rootCause: parsed.rootCause || '',
        microIntervention: parsed.microIntervention || '',
        patternDetected: parsed.patternDetected || 'none',
        isCrisis: Boolean(parsed.isCrisis),
        crisisMessage: parsed.crisisMessage || '',
        isBreakthrough: Boolean(parsed.isBreakthrough),
      });
      setStreamingText('');
      setSubmitted(true);
      setCheckinsThisWeek(prev => prev + 1);

      // Prompt 2: check for a cross-check-in pattern once there's history to look at.
      if (!parsed.isCrisis) {
        fetch('/api/mood/patterns')
          .then((r) => r.json())
          .then((data) => setPattern(data.pattern || null))
          .catch((err) => console.error('Failed to load pattern insight:', err));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get coaching insight');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Daily Mental OS</h1>
              <p className="text-slate-400">
                Your personal AI wellness coach • {userPlan === 'free' ? `${FREE_LIMIT - checkinsThisWeek} check-ins left this week` : 'Unlimited'}
              </p>
            </div>
            {weeklySynthesis && (
              <button
                onClick={() => setShowWeekly((v) => !v)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg px-3 py-2 transition shrink-0"
              >
                <Mail size={16} />
                Weekly Insight
              </button>
            )}
          </div>

          {/* Weekly Synthesis (Prompt 3) */}
          {showWeekly && weeklySynthesis && (
            <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{weeklySynthesis.subject}</h3>
                <button
                  onClick={() => setShowWeekly(false)}
                  className="text-slate-400 hover:text-white text-sm transition"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-300 whitespace-pre-line leading-relaxed">{weeklySynthesis.body}</p>
            </div>
          )}

          {/* Crisis State (Prompt 5) — takes priority over everything else */}
          {submitted && response.isCrisis && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <ShieldAlert className="text-red-400 mt-1 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">We&apos;re concerned about you</h3>
                  <p className="text-slate-200 whitespace-pre-line leading-relaxed">{response.crisisMessage}</p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ moodScore: 5, energyLevel: 5, stressLevel: 5, journalEntry: '' });
                    }}
                    className="text-slate-400 hover:text-white text-sm transition mt-4"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Breakthrough Celebration (Prompt 6) */}
          {submitted && !response.isCrisis && response.isBreakthrough && (
            <div className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <Sparkles className="text-amber-300 mt-1 shrink-0" size={24} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Breakthrough moment 🎉</h3>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setPattern(null);
                        setForm({ moodScore: 5, energyLevel: 5, stressLevel: 5, journalEntry: '' });
                      }}
                      className="text-slate-400 hover:text-white text-sm transition"
                    >
                      ✕ New check-in
                    </button>
                  </div>
                  <p className="text-slate-200 mb-4 leading-relaxed">{response.insight}</p>
                  {response.microIntervention && (
                    <p className="text-amber-200 font-medium leading-relaxed">Keep the momentum: {response.microIntervention}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Standard Coaching Insight (Prompts 1 & 4) */}
          {submitted && !response.isCrisis && !response.isBreakthrough && (
            <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-emerald-400 mt-1 shrink-0" size={24} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Your coaching insight</h3>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setPattern(null);
                        setForm({ moodScore: 5, energyLevel: 5, stressLevel: 5, journalEntry: '' });
                      }}
                      className="text-slate-400 hover:text-white text-sm transition"
                    >
                      ✕ New check-in
                    </button>
                  </div>
                  <p className="text-slate-300 mb-4 leading-relaxed">{response.insight}</p>
                  {response.rootCause && (
                    <p className="text-slate-400 text-sm mb-2">What&apos;s really going on: <span className="text-slate-300">{response.rootCause}</span></p>
                  )}
                  {response.microIntervention && (
                    <p className="text-emerald-300 font-medium leading-relaxed">💡 {response.microIntervention}</p>
                  )}
                  {response.patternDetected && response.patternDetected !== 'none' && (
                    <p className="text-slate-400 text-sm mt-3">Pattern detected: <span className="text-slate-300">{response.patternDetected.replace(/_/g, ' ')}</span></p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cross-check-in Pattern (Prompt 2) */}
          {submitted && !response.isCrisis && pattern && (
            <div className="bg-blue-500/10 border border-blue-500/40 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <TrendingUp className="text-blue-400 mt-1 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">{pattern.pattern}</h3>
                  <p className="text-slate-400 text-sm mb-2">{pattern.evidence}</p>
                  <p className="text-slate-300 mb-3 leading-relaxed">{pattern.rootCause}</p>
                  <p className="text-blue-300 font-medium leading-relaxed mb-2">Try this: {pattern.solution}</p>
                  <p className="text-slate-400 text-sm">Experiment: {pattern.experimentToTry}</p>
                </div>
              </div>
            </div>
          )}

          {/* Streaming insight */}
          {loading && (
            <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-blue-400 text-sm font-medium">Claude is analyzing...</span>
              </div>
              {extractStreamingInsight(streamingText) ? (
                <p className="text-slate-300 leading-relaxed">
                  {extractStreamingInsight(streamingText)}
                  <span className="animate-pulse text-blue-400">▊</span>
                </p>
              ) : (
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          )}

          {/* Freemium Limit Hit */}
          {isFreemiumLimited && (
            <div className="bg-amber-500/20 border border-amber-500 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <Zap className="text-amber-400 mt-1" size={24} />
                <div>
                  <h3 className="text-white font-semibold mb-2">You&apos;ve hit your weekly limit</h3>
                  <p className="text-slate-300 mb-4">Free users get 3 check-ins per week. Upgrade to Plus for unlimited daily coaching.</p>
                  <button
                    onClick={() => handleUpgrade(PLUS_PRICE_ID)}
                    disabled={upgrading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    {upgrading ? 'Redirecting...' : 'Upgrade to Plus ($9.99/mo)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 mb-6">
            {/* Mood Score */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-4">
                How are you feeling? <span className="text-slate-400">{form.moodScore}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.moodScore}
                onChange={(e) => setForm({ ...form, moodScore: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>😢 Terrible</span>
                <span>😐 Neutral</span>
                <span>😄 Great</span>
              </div>
            </div>

            {/* Energy Level */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-4">
                Energy level? <span className="text-slate-400">{form.energyLevel}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.energyLevel}
                onChange={(e) => setForm({ ...form, energyLevel: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>

            {/* Stress Level */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-4">
                Stress level? <span className="text-slate-400">{form.stressLevel}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.stressLevel}
                onChange={(e) => setForm({ ...form, stressLevel: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Journal Entry */}
            <div className="mb-8">
              <label className="block text-white font-medium mb-3">What&apos;s on your mind? (optional)</label>
              <textarea
                value={form.journalEntry}
                onChange={(e) => setForm({ ...form, journalEntry: e.target.value })}
                placeholder="Share your thoughts, feelings, or what happened today..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 min-h-32 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-400 mb-6">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isFreemiumLimited}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Get AI Coaching
                </>
              )}
            </button>
          </form>

          {/* Freemium CTA (bottom) */}
          {userPlan === 'free' && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-2">Unlock Unlimited Insights</h3>
              <p className="text-slate-300 mb-4">Get daily AI coaching, mood trends, and personalized patterns.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpgrade(PLUS_PRICE_ID)}
                  disabled={upgrading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium transition flex-1 flex items-center justify-center gap-2"
                >
                  {upgrading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Upgrade to Plus ($9.99/mo)'
                  )}
                </button>
                <button
                  onClick={() => router.push('/plans')}
                  className="border border-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition flex-1"
                >
                  See All Plans
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}