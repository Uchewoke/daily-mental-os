'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [userPlan, setUserPlan] = useState('free');
  const [checkinsThisWeek, setCheckinsThisWeek] = useState(0);
  
  const [form, setForm] = useState({
    moodScore: 5,
    energyLevel: 5,
    stressLevel: 5,
    journalEntry: ''
  });

  const [response, setResponse] = useState({
    insight: '',
    coachingTip: '',
    pattern: ''
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
    loadUserData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (isFreemiumLimited) {
      setError(`Free users can only check in ${FREE_LIMIT}x per week. Upgrade to Plus for unlimited.`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/mood/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const data = await res.json();
      setResponse(data);
      setSubmitted(true);
      setCheckinsThisWeek(prev => prev + 1);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setForm({ moodScore: 5, energyLevel: 5, stressLevel: 5, journalEntry: '' });
        setSubmitted(false);
        setResponse({ insight: '', coachingTip: '', pattern: '' });
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Daily Mental OS</h1>
            <p className="text-slate-400">
              Your personal AI wellness coach • {userPlan === 'free' ? `${FREE_LIMIT - checkinsThisWeek} check-ins left this week` : 'Unlimited'} 
            </p>
          </div>

          {/* Success State */}
          {submitted && (
            <div className="bg-emerald-500/20 border border-emerald-500 rounded-lg p-6 mb-6 animate-in fade-in slide-in-from-top">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="text-emerald-400 mt-1" size={24} />
                <div>
                  <h3 className="text-white font-semibold mb-2">Your check-in was logged!</h3>
                  <p className="text-slate-300 mb-4">{response.insight}</p>
                  <p className="text-emerald-300 font-medium">💡 {response.coachingTip}</p>
                  {response.pattern && (
                    <p className="text-slate-400 text-sm mt-2">Pattern: <span className="text-slate-300">{response.pattern}</span></p>
                  )}
                </div>
              </div>
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
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                    Upgrade to Plus ($4.99/mo)
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
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition flex-1">
                  Upgrade to Plus ($4.99/mo)
                </button>
                <button className="border border-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition flex-1">
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