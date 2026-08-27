import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Tag, 
  ArrowRight, 
  Copy, 
  Check, 
  Download, 
  X,
  ListTodo,
  Smile,
  HelpCircle
} from 'lucide-react';
import { JournalSummary } from '../types';

interface SummaryModalProps {
  summary: JournalSummary;
  onClose: () => void;
  onViewDetails: (summaryId: string) => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  summary,
  onClose,
  onViewDetails,
}) => {
  const [copied, setCopied] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const toggleAction = (index: number) => {
    setCompletedActions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCopy = () => {
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
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Banner */}
        <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Reflection Synthesis Completed</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {summary.title}
            </h2>
            <p className="text-xs text-slate-400">
              Generated from {summary.messageCount} conversational turns &bull; Saved securely in Firestore
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
          
          {/* Executive Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Executive Synthesis</span>
            </h3>
            <p className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-200 leading-relaxed">
              {summary.overview}
            </p>
          </div>

          {/* Mood & Cognitive State */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-rose-400" />
              <span>Mind &amp; Mood Assessment</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-200 text-xs leading-relaxed">
              {summary.moodInsights}
            </div>
          </div>

          {/* Key Themes Chips */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Identified Themes</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.keyThemes.map((theme, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium"
                >
                  #{theme}
                </span>
              ))}
            </div>
          </div>

          {/* Action Items Checklist */}
          {summary.actionItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
                <span>Action Commitments</span>
              </h3>
              <div className="space-y-2">
                {summary.actionItems.map((action, i) => (
                  <div
                    key={i}
                    onClick={() => toggleAction(i)}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                      completedActions[i]
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 line-through'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!completedActions[i]}
                      onChange={() => toggleAction(i)}
                      className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                    <span className="text-xs leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Future Reflection Prompts */}
          {summary.followUpQuestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Questions for your next session</span>
              </h3>
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200 text-xs space-y-2">
                {summary.followUpQuestions.map((q, i) => (
                  <p key={i} className="flex items-start gap-2">
                    <span className="font-bold text-amber-400">&bull;</span>
                    <span>{q}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            id="btn-copy-summary"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Markdown'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
            <button
              id="btn-modal-view-details"
              onClick={() => onViewDetails(summary.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>View Full Entry</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
