import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  MessageSquare, 
  Calendar, 
  Tag, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  ListTodo, 
  Smile, 
  HelpCircle,
  Clock,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { JournalSummary, JournalMessage, JournalSession } from '../types';
import { getSessionMessages, deleteJournalSession } from '../services/journalStorage';
import { JOURNAL_MODES } from '../data/modes';

interface SummaryDetailViewProps {
  summary: JournalSummary;
  session?: JournalSession;
  onBack: () => void;
  onResumeChat?: (sessionId: string) => void;
  onDeleted: () => void;
}

export const SummaryDetailView: React.FC<SummaryDetailViewProps> = ({
  summary,
  session,
  onBack,
  onResumeChat,
  onDeleted,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const modeConfig = JOURNAL_MODES.find(m => m.id === summary.mode) || JOURNAL_MODES[0];

  useEffect(() => {
    async function loadTranscript() {
      if (!user || !summary.sessionId) return;
      setIsLoadingMessages(true);
      try {
        const msgs = await getSessionMessages(user.uid, summary.sessionId);
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to load messages for summary transcript:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    }
    loadTranscript();
  }, [summary.sessionId, user]);

  const handleCopyMarkdown = () => {
    const text = `# ${summary.title}
*Date: ${new Date(summary.createdAt).toLocaleDateString()} | Mode: ${summary.mode}*

## Executive Summary
${summary.overview}

## Key Themes
${summary.keyThemes.map(t => `- #${t}`).join('\n')}

## Action Commitments
${summary.actionItems.map(a => `- [ ] ${a}`).join('\n')}

## Mind & Mood Insights
${summary.moodInsights}

## Future Reflection Prompts
${summary.followUpQuestions.map(q => `- ${q}`).join('\n')}

---
## Conversation Transcript (${messages.length} messages)
${messages.map(m => `### ${m.role === 'user' ? 'User' : 'Gemini'}:\n${m.text}`).join('\n\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = `# ${summary.title}
*Date: ${new Date(summary.createdAt).toLocaleDateString()} | Mode: ${summary.mode}*

## Executive Summary
${summary.overview}

## Key Themes
${summary.keyThemes.map(t => `- #${t}`).join('\n')}

## Action Commitments
${summary.actionItems.map(a => `- [ ] ${a}`).join('\n')}

## Mind & Mood Insights
${summary.moodInsights}

## Future Reflection Prompts
${summary.followUpQuestions.map(q => `- ${q}`).join('\n')}
`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      if (summary.sessionId) {
        await deleteJournalSession(user.uid, summary.sessionId);
      }
      onDeleted();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          id="btn-summary-detail-back"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {onResumeChat && summary.sessionId && (
            <button
              id="btn-resume-chat-from-summary"
              onClick={() => onResumeChat(summary.sessionId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Resume Chat</span>
            </button>
          )}

          <button
            id="btn-detail-copy"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            id="btn-detail-download"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            id="btn-detail-delete"
            onClick={() => setShowConfirmDelete(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Delete session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-4">
          <div className="text-xs text-rose-200">
            <span className="font-bold">Permanently delete this journal session?</span> This action removes messages from Firestore and cannot be undone.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Now'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-800 border border-slate-700 ${modeConfig.color}`}>
            {modeConfig.name}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(summary.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(summary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {summary.title}
        </h1>

        {/* View Mode Toggle: Summary vs Transcript */}
        <div className="pt-2 flex border-b border-slate-800 gap-6">
          <button
            id="tab-btn-summary"
            onClick={() => setActiveTab('summary')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Summary &amp; Action Plan</span>
          </button>

          <button
            id="tab-btn-transcript"
            onClick={() => setActiveTab('transcript')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'transcript'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Conversation Transcript ({messages.length})</span>
          </button>
        </div>
      </div>

      {/* Tab: Summary View */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Executive Overview */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Executive Synthesis
            </h2>
            <p className="text-slate-200 leading-relaxed text-base">
              {summary.overview}
            </p>
          </section>

          {/* Mood & Mind Insights */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Smile className="w-4 h-4" />
              <span>Mind &amp; Mood Assessment</span>
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              {summary.moodInsights}
            </p>
          </section>

          {/* Key Themes */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              <span>Core Themes &amp; Topics</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {summary.keyThemes.map((theme, i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium"
                >
                  #{theme}
                </span>
              ))}
            </div>
          </section>

          {/* Action Commitments */}
          {summary.actionItems.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" />
                <span>Action Commitments</span>
              </h2>
              <div className="space-y-2">
                {summary.actionItems.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 text-sm flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Follow Up Reflection Questions */}
          {summary.followUpQuestions.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Questions for Future Reflection</span>
              </h2>
              <div className="space-y-2">
                {summary.followUpQuestions.map((q, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200 text-sm flex items-start gap-3">
                    <span className="font-bold text-amber-400">?</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Tab: Original Transcript View */}
      {activeTab === 'transcript' && (
        <div className="space-y-4">
          {isLoadingMessages ? (
            <div className="p-8 text-center text-slate-400">Loading conversation transcript...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No transcript recorded for this session.</div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border ${
                    isUser
                      ? 'bg-slate-850 border-indigo-500/30'
                      : 'bg-slate-900 border-slate-800'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className={`font-semibold ${isUser ? 'text-indigo-400' : 'text-amber-400'}`}>
                      {isUser ? 'You' : 'Gemini 2.5'}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="markdown-body prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
