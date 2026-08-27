import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  PlusCircle,
  Tag,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { JournalSession, JournalSummary, JournalMode } from '../types';
import { JOURNAL_MODES } from '../data/modes';
import { useAuth } from '../contexts/AuthContext';
import { deleteJournalSession } from '../services/journalStorage';

interface HistoryViewProps {
  sessions: JournalSession[];
  summaries: JournalSummary[];
  onResumeSession: (sessionId: string) => void;
  onViewSummary: (summaryId: string) => void;
  onNewSession: () => void;
  onRefresh: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  summaries,
  onResumeSession,
  onViewSummary,
  onNewSession,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'summarized' | 'active'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm('Delete this journal session? This cannot be undone.')) return;

    setDeletingId(sessionId);
    try {
      await deleteJournalSession(user.uid, sessionId);
      onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    // Mode match
    if (selectedMode !== 'all' && s.mode !== selectedMode) return false;

    // Status match
    if (statusFilter === 'summarized' && !s.isSummarized) return false;
    if (statusFilter === 'active' && s.isSummarized) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchPreview = s.lastMessagePreview?.toLowerCase().includes(q);
      const matchMode = s.mode.toLowerCase().includes(q);
      return matchTitle || matchPreview || matchMode;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-400" />
            Journal Archive &amp; History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your private past journal conversations and generated summaries
          </p>
        </div>

        <button
          id="btn-history-new-session"
          onClick={onNewSession}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Journal Session</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-history-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions by title, thought keywords, or mode..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Mode Selector */}
          <div className="md:col-span-3">
            <select
              id="select-history-mode"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Journal Modes</option>
              {JOURNAL_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              id="select-history-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="summarized">Summarized Sessions</option>
              <option value="active">Active In-Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">No matching sessions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query or mode filters, or start a new journal session now.
            </p>
          </div>
          <button
            onClick={onNewSession}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Start New Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((ses) => {
            const modeInfo = JOURNAL_MODES.find(m => m.id === ses.mode);
            return (
              <div
                id={`history-card-${ses.id}`}
                key={ses.id}
                onClick={() => {
                  if (ses.isSummarized && ses.summaryId) {
                    onViewSummary(ses.summaryId);
                  } else {
                    onResumeSession(ses.id);
                  }
                }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300">
                      {modeInfo?.name || ses.mode}
                    </span>

                    <button
                      onClick={(e) => handleDelete(ses.id, e)}
                      disabled={deletingId === ses.id}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete this session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-white text-sm group-hover:text-indigo-200 transition-colors line-clamp-2">
                    {ses.title}
                  </h3>

                  {ses.lastMessagePreview && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      "{ses.lastMessagePreview}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {ses.isSummarized ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Summarized
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {ses.messageCount || 1} turns
                      </span>
                    )}
                  </div>

                  <span>
                    {new Date(ses.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
