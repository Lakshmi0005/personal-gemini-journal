import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw, 
  Lightbulb, 
  AlertCircle,
  Copy,
  Check,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { JournalSession, JournalMessage, JournalMode, JournalSummary } from '../types';
import { JOURNAL_MODES } from '../data/modes';
import { sendChatMessage, generateSessionSummary } from '../lib/api';
import { 
  saveJournalSession, 
  saveSessionMessage, 
  getSessionMessages, 
  saveJournalSummary 
} from '../services/journalStorage';

interface JournalChatViewProps {
  session: JournalSession;
  onBack: () => void;
  onSummaryGenerated: (summary: JournalSummary) => void;
}

export const JournalChatView: React.FC<JournalChatViewProps> = ({
  session,
  onBack,
  onSummaryGenerated,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModeConfig = JOURNAL_MODES.find(m => m.id === session.mode) || JOURNAL_MODES[0];

  // Load existing messages or initialize with welcoming assistant prompt
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) return;
      try {
        const storedMsgs = await getSessionMessages(user.uid, session.id);
        if (isMounted) {
          if (storedMsgs.length > 0) {
            setMessages(storedMsgs);
          } else {
            // First time initialization with initial prompt
            const initialMsg: JournalMessage = {
              id: `msg_init_${Date.now()}`,
              role: 'model',
              text: currentModeConfig.initialPrompt,
              timestamp: Date.now()
            };
            setMessages([initialMsg]);
            await saveSessionMessage(user.uid, session.id, initialMsg);
            await saveJournalSession(user.uid, {
              ...session,
              messageCount: 1,
              lastMessagePreview: initialMsg.text
            });
          }
        }
      } catch (err: any) {
        console.error('Failed to load session messages:', err);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [session.id, user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !user || isLoading) return;

    setInputText('');
    setErrorMessage(null);

    const userMsg: JournalMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 1. Save user message in Firestore
      await saveSessionMessage(user.uid, session.id, userMsg);
      await saveJournalSession(user.uid, {
        ...session,
        messageCount: newMessages.length,
        lastMessagePreview: textToSend,
        updatedAt: Date.now()
      });

      // 2. Call server-side Gemini API
      const historyPayload = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        text: m.text
      }));

      const apiResponse = await sendChatMessage({
        sessionId: session.id,
        message: textToSend,
        history: historyPayload,
        mode: session.mode
      });

      const modelMsg: JournalMessage = {
        id: `msg_${Date.now()}_m`,
        role: 'model',
        text: apiResponse.reply,
        timestamp: apiResponse.timestamp || Date.now()
      };

      const updatedHistory = [...newMessages, modelMsg];
      setMessages(updatedHistory);

      // 3. Save assistant message in Firestore
      await saveSessionMessage(user.uid, session.id, modelMsg);
      await saveJournalSession(user.uid, {
        ...session,
        messageCount: updatedHistory.length,
        lastMessagePreview: modelMsg.text.slice(0, 100),
        updatedAt: Date.now()
      });

    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Failed to communicate with Gemini. Please try again.');
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFinishAndSummarize = async () => {
    if (!user || isSummarizing) return;
    if (messages.filter(m => m.role === 'user').length === 0) {
      setErrorMessage('Please share at least one thought before generating a summary.');
      return;
    }

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      // 1. Call server-side Gemini summarization
      const summary = await generateSessionSummary({
        sessionId: session.id,
        mode: session.mode,
        messages: messages.map(m => ({ role: m.role, text: m.text }))
      });

      // 2. Save summary to Firestore under /users/{uid}/summaries/{summaryId}
      await saveJournalSummary(user.uid, summary);

      // 3. Open summary modal
      onSummaryGenerated(summary);
    } catch (err: any) {
      console.error('Summarization failed:', err);
      setErrorMessage(err.message || 'Failed to generate session summary. Please check your connection.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Preset suggested reflection prompts based on mode
  const suggestionPrompts: Record<JournalMode, string[]> = {
    daily_reflection: [
      "The biggest highlight of today was...",
      "One thing that drained my energy today was...",
      "What did I learn about myself today?"
    ],
    brainstorming: [
      "Here is the core problem I want to solve...",
      "What if we approached this without constraints?",
      "Help me break this idea into 3 progressive phases."
    ],
    decision_making: [
      "I am currently torn between Option A and Option B...",
      "What are the blind spots I might be ignoring?",
      "If I look back in 5 years, which path matters more?"
    ],
    emotional_checkin: [
      "I feel a mix of excitement and anxiety because...",
      "Right now, my mind feels crowded by...",
      "What I need most right now is..."
    ],
    gratitude: [
      "I am grateful for this person who supported me...",
      "A small comfort I enjoyed today was...",
      "Something that went unexpectedly right recently..."
    ],
    goal_planning: [
      "My primary milestone for the next 30 days is...",
      "What is the single highest-impact action I can take tomorrow?",
      "Help me design a friction-free routine for this goal."
    ]
  };

  const activeSuggestions = suggestionPrompts[session.mode] || suggestionPrompts.daily_reflection;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4.5rem)]">
      
      {/* Session Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-chat-back"
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 ${currentModeConfig.color}`}>
                {currentModeConfig.name}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {messages.length} {messages.length === 1 ? 'turn' : 'turns'}
              </span>
            </div>
            <h1 className="text-base font-bold text-white truncate max-w-sm sm:max-w-md mt-0.5">
              {session.title || 'Active Journal Session'}
            </h1>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Isolated Session</span>
          </div>

          <button
            id="btn-finish-summarize"
            onClick={handleFinishAndSummarize}
            disabled={isSummarizing || isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSummarizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Summarizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Finish &amp; Summarize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-xs text-rose-400 hover:text-rose-200 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages Conversation Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  {isUser ? 'You' : 'Gemini 2.5'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                <div className="markdown-body prose prose-invert prose-sm max-w-none text-slate-100 leading-relaxed break-words">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                <button
                  onClick={() => handleCopyText(msg.id, msg.text)}
                  className={`absolute top-2 right-2 p-1 rounded bg-slate-800/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                    isUser ? 'hover:bg-indigo-800' : 'hover:bg-slate-700'
                  }`}
                  title="Copy message"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {/* Gemini Typing / Generation Animation */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 px-1">
              Gemini 2.5 is thinking...
            </span>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && !isLoading && (
        <div className="mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggested prompts for {currentModeConfig.name}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSuggestions.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs text-slate-300 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl transition-colors text-left active:scale-[0.98] cursor-pointer"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-xl shrink-0 space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            id="input-chat-message"
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reflection or response... (Shift+Enter for newline)"
            maxLength={5000}
            disabled={isLoading || isSummarizing}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none focus:outline-none p-2 rounded-lg max-h-32"
          />

          <button
            id="btn-chat-send"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading || isSummarizing}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Input Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Server-side encryption verified</span>
          </div>
          <span>{inputText.length} / 5000</span>
        </div>
      </div>

    </div>
  );
};
