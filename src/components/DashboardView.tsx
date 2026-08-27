import React from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  Compass, 
  HeartHandshake, 
  Target, 
  ArrowUpRight, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { JournalSession, JournalSummary, JournalMode } from '../types';
import { JOURNAL_MODES } from '../data/modes';
import { AIJourneyCard } from './AIJourneyCard';

interface DashboardViewProps {
  sessions: JournalSession[];
  summaries: JournalSummary[];
  onStartSessionWithMode: (mode: JournalMode) => void;
  onStartSessionWithPrompt?: (mode: JournalMode, promptText: string) => void;
  onResumeSession: (sessionId: string) => void;
  onViewSummary: (summaryId: string) => void;
  onViewAllHistory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  summaries,
  onStartSessionWithMode,
  onStartSessionWithPrompt,
  onResumeSession,
  onViewSummary,
  onViewAllHistory,
}) => {
  const { userProfile } = useAuth();

  const getModeIcon = (modeId: JournalMode) => {
    switch (modeId) {
      case 'daily_reflection': return <BookOpen className="w-5 h-5" />;
      case 'brainstorming': return <Lightbulb className="w-5 h-5" />;
      case 'decision_making': return <Compass className="w-5 h-5" />;
      case 'emotional_checkin': return <HeartHandshake className="w-5 h-5" />;
      case 'gratitude': return <Sparkles className="w-5 h-5" />;
      case 'goal_planning': return <Target className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const recentSessions = sessions.slice(0, 4);
  const recentSummaries = summaries.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / Welcome & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Isolated User Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {getGreeting()}, {userProfile?.displayName || 'Journaler'}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Your safe space to think out loud. Conversations are processed via server-side Gemini 2.5 and isolated to your UID.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 min-w-[110px] text-center">
              <span className="text-2xl font-bold text-indigo-400">{sessions.length}</span>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Sessions</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 min-w-[110px] text-center">
              <span className="text-2xl font-bold text-amber-400">{summaries.length}</span>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Summaries</p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 min-w-[110px] text-center">
              <span className="text-2xl font-bold text-emerald-400">100%</span>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Encrypted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modes Grid: Choose your Journaling Mode */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Start a New Journal Session
            </h2>
            <p className="text-xs text-slate-400">
              Select a guided mode to start a multi-turn conversation with Gemini
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {JOURNAL_MODES.map((mode) => (
            <button
              id={`btn-mode-${mode.id}`}
              key={mode.id}
              onClick={() => onStartSessionWithMode(mode.id)}
              className="group p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-left flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 ${mode.color}`}>
                    {getModeIcon(mode.id)}
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-indigo-300 font-medium flex items-center gap-1">
                    Start <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base group-hover:text-indigo-200 transition-colors">
                    {mode.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {mode.tagline}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Personal AI Journey Section */}
      <AIJourneyCard
        summaries={summaries}
        sessionCount={sessions.length}
        onStartSessionWithMode={onStartSessionWithMode}
        onStartSessionWithPrompt={onStartSessionWithPrompt}
      />

      {/* Bottom 2-Column Split: Active/Recent Sessions & Latest Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Journal Sessions */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recent Journal Sessions
            </h2>
            {sessions.length > 0 && (
              <button
                id="btn-view-all-sessions"
                onClick={onViewAllHistory}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                View all ({sessions.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">No journal sessions yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pick a mode above to start your first private conversation with Gemini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((ses) => (
                <div
                  id={`session-card-${ses.id}`}
                  key={ses.id}
                  onClick={() => onResumeSession(ses.id)}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700">
                        {ses.mode.replace('_', ' ')}
                      </span>
                      {ses.isSummarized ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Summarized
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Active Chat
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">
                      {ses.title}
                    </h3>
                    {ses.lastMessagePreview && (
                      <p className="text-xs text-slate-400 truncate">
                        "{ses.lastMessagePreview}"
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 text-xs text-slate-500">
                    {new Date(ses.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest AI Summaries */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Latest AI Reflection Summaries
            </h2>
          </div>

          {recentSummaries.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">No summaries generated yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                When you wrap up a conversation and click "Finish &amp; Summarize", Gemini generates structured insights here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSummaries.map((sum) => (
                <div
                  id={`summary-card-${sum.id}`}
                  key={sum.id}
                  onClick={() => onViewSummary(sum.id)}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-850 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white hover:text-amber-300 transition-colors">
                      {sum.title}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {new Date(sum.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {sum.overview}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sum.keyThemes.slice(0, 3).map((theme, i) => (
                      <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        #{theme}
                      </span>
                    ))}
                    {sum.actionItems.length > 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {sum.actionItems.length} actions
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
