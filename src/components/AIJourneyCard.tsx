import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw, 
  Lightbulb, 
  Layers, 
  ArrowRight,
  AlertCircle,
  Clock
} from 'lucide-react';
import { PersonalAIJourney, JournalMode, JournalSummary } from '../types';
import { fetchPersonalAIJourney } from '../lib/api';

interface AIJourneyCardProps {
  summaries: JournalSummary[];
  sessionCount: number;
  onStartSessionWithPrompt?: (mode: JournalMode, promptText: string) => void;
  onStartSessionWithMode?: (mode: JournalMode) => void;
}

export const AIJourneyCard: React.FC<AIJourneyCardProps> = ({
  summaries,
  sessionCount,
  onStartSessionWithPrompt,
  onStartSessionWithMode,
}) => {
  const [journey, setJourney] = useState<PersonalAIJourney | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const loadJourney = async (forceRefresh: boolean = false) => {
    // If no summaries at all, provide clean initial state without unnecessary API call
    if (!summaries || summaries.length === 0) {
      setJourney({
        totalSessions: sessionCount,
        recurringThemes: [],
        growthInsight: "You haven't completed any journal reflection summaries yet. Start a session and click 'Finish & Summarize' to begin charting your AI Journey.",
        openActionCommitments: [],
        journeyReflectionPrompts: [
          "What is the most important goal or question on your mind right now?",
          "What is one challenge you'd like to work through today?"
        ],
        analyzedAt: Date.now()
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchPersonalAIJourney(summaries, sessionCount);
      setJourney(data);
      setLastFetched(Date.now());
    } catch (err: any) {
      console.warn('[AI Journey] Failed to fetch journey data:', err?.message || err);
      setError(err?.message || 'Unable to analyze journey at this moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJourney();
  }, [summaries.length]);

  const handlePromptClick = (promptText: string) => {
    if (onStartSessionWithPrompt) {
      onStartSessionWithPrompt('daily_reflection', promptText);
    } else if (onStartSessionWithMode) {
      onStartSessionWithMode('daily_reflection');
    }
  };

  return (
    <section id="personal-ai-journey-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Personal AI Journey
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Cross-Session Insights
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Longitudinal progress, recurring themes, and actionable commitments synthesized by Gemini
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-journey"
          onClick={() => loadJourney(true)}
          disabled={loading || !summaries || summaries.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Refresh AI Journey Analysis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span className="hidden sm:inline">{loading ? 'Analyzing...' : 'Refresh Insights'}</span>
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg space-y-6">
        
        {/* Loading State */}
        {loading && !journey && (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium text-slate-300">Synthesizing your journal reflections...</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Gemini is reviewing your saved session summaries to detect growth patterns and overarching commitments.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Unable to load AI Journey</p>
              <p className="text-rose-300/80">{error}</p>
              <button
                onClick={() => loadJourney(true)}
                className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Content View */}
        {journey && !loading && (
          <>
            {/* Top Insight Row: Growth Trajectory */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900/80 border border-indigo-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Recent Growth &amp; Trajectory Insight</span>
                </div>
                {journey.totalSessions > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                    {journey.totalSessions} {journey.totalSessions === 1 ? 'Session' : 'Sessions'} Analyzed
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {journey.growthInsight}
              </p>
            </div>

            {/* Recurring Themes Grid */}
            {journey.recurringThemes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Recurring Themes Across Your Journey</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {journey.recurringThemes.map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:border-indigo-500/40 transition-colors"
                    >
                      <span className="text-indigo-400 font-bold">#{item.theme}</span>
                      {item.count > 1 && (
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-slate-400 font-mono">
                          {item.count}×
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2-Column Split: Open Action Commitments & Proactive Reflection Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Open Commitments */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Open Commitments &amp; Key Takeaways</span>
                </div>
                {journey.openActionCommitments.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
                    No open action items recorded yet. Commitments from your future summaries will appear here.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {journey.openActionCommitments.map((action, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 flex items-start gap-2.5 leading-relaxed"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Proactive Reflection Prompts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Forward-Looking Reflection Prompts</span>
                </div>
                <div className="space-y-2">
                  {journey.journeyReflectionPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      id={`btn-journey-prompt-${idx}`}
                      onClick={() => handlePromptClick(prompt)}
                      className="w-full text-left p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/40 hover:bg-slate-800 transition-all text-xs text-slate-200 group flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <span className="leading-relaxed group-hover:text-amber-200 transition-colors">
                        "{prompt}"
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Analyzed Footer Timestamp */}
            {journey.analyzedAt && (
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Synthesized from your private summaries</span>
                </div>
                <span>
                  Updated {new Date(journey.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
};
