import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { JournalChatView } from './components/JournalChatView';
import { HistoryView } from './components/HistoryView';
import { SummaryDetailView } from './components/SummaryDetailView';
import { SummaryModal } from './components/SummaryModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { JournalSession, JournalSummary, JournalMode } from './types';
import { getUserSessions, getUserSummaries, saveJournalSession, getJournalSummary } from './services/journalStorage';
import { JOURNAL_MODES } from './data/modes';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'chat' | 'history' | 'summary-detail'>('dashboard');
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [summaries, setSummaries] = useState<JournalSummary[]>([]);
  const [activeSession, setActiveSession] = useState<JournalSession | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<JournalSummary | null>(null);
  const [newlyCreatedSummary, setNewlyCreatedSummary] = useState<JournalSummary | null>(null);
  const [showSecurityAudit, setShowSecurityAudit] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load user sessions and summaries from Firestore
  const loadUserData = async () => {
    if (!user) {
      setSessions([]);
      setSummaries([]);
      return;
    }
    setIsLoadingData(true);
    try {
      const [userSessions, userSummaries] = await Promise.all([
        getUserSessions(user.uid),
        getUserSummaries(user.uid),
      ]);
      setSessions(userSessions);
      setSummaries(userSummaries);
    } catch (err) {
      console.error('Failed to load user journal data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setActiveSession(null);
      setSelectedSummary(null);
      setCurrentTab('dashboard');
    }
  }, [user]);

  // Start a new journal session with a specific mode
  const handleStartSessionWithMode = async (mode: JournalMode) => {
    if (!user) return;
    const modeConfig = JOURNAL_MODES.find(m => m.id === mode) || JOURNAL_MODES[0];
    const newSessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    const newSession: JournalSession = {
      id: newSessionId,
      userId: user.uid,
      title: `${modeConfig.name} - ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      mode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      status: 'active'
    };

    try {
      await saveJournalSession(user.uid, newSession);
      setActiveSession(newSession);
      setCurrentTab('chat');
      loadUserData();
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  // Resume an existing session
  const handleResumeSession = (sessionId: string) => {
    const ses = sessions.find(s => s.id === sessionId);
    if (ses) {
      setActiveSession(ses);
      setCurrentTab('chat');
    }
  };

  // View summary detail
  const handleViewSummary = async (summaryId: string) => {
    let sum = summaries.find(s => s.id === summaryId);
    if (!sum && user) {
      sum = (await getJournalSummary(user.uid, summaryId)) || undefined;
    }
    if (sum) {
      setSelectedSummary(sum);
      setCurrentTab('summary-detail');
    }
  };

  // Summary generation callback
  const handleSummaryGenerated = (summary: JournalSummary) => {
    setNewlyCreatedSummary(summary);
    loadUserData();
  };

  // If authentication is initializing, display clean loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Verifying secure session...</p>
      </div>
    );
  }

  // If not authenticated, display landing & auth view
  if (!user) {
    return (
      <>
        <Navbar 
          currentTab="dashboard" 
          setCurrentTab={() => {}} 
          onNewSession={() => {}} 
          onOpenSecurityAudit={() => setShowSecurityAudit(true)}
          hasActiveChat={false}
        />
        <LandingView />
        {showSecurityAudit && (
          <SecurityAuditModal onClose={() => setShowSecurityAudit(false)} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => setCurrentTab(tab)}
        onNewSession={() => handleStartSessionWithMode('daily_reflection')}
        onOpenSecurityAudit={() => setShowSecurityAudit(true)}
        hasActiveChat={!!activeSession}
      />

      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <DashboardView
            sessions={sessions}
            summaries={summaries}
            onStartSessionWithMode={handleStartSessionWithMode}
            onStartSessionWithPrompt={(mode, _prompt) => handleStartSessionWithMode(mode)}
            onResumeSession={handleResumeSession}
            onViewSummary={handleViewSummary}
            onViewAllHistory={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'chat' && activeSession && (
          <JournalChatView
            session={activeSession}
            onBack={() => {
              setCurrentTab('dashboard');
              loadUserData();
            }}
            onSummaryGenerated={handleSummaryGenerated}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            sessions={sessions}
            summaries={summaries}
            onResumeSession={handleResumeSession}
            onViewSummary={handleViewSummary}
            onNewSession={() => handleStartSessionWithMode('daily_reflection')}
            onRefresh={loadUserData}
          />
        )}

        {currentTab === 'summary-detail' && selectedSummary && (
          <SummaryDetailView
            summary={selectedSummary}
            session={sessions.find(s => s.id === selectedSummary.sessionId)}
            onBack={() => setCurrentTab('dashboard')}
            onResumeChat={(sessionId) => handleResumeSession(sessionId)}
            onDeleted={() => {
              setCurrentTab('dashboard');
              loadUserData();
            }}
          />
        )}
      </main>

      {/* Pop-up modal after generating summary */}
      {newlyCreatedSummary && (
        <SummaryModal
          summary={newlyCreatedSummary}
          onClose={() => setNewlyCreatedSummary(null)}
          onViewDetails={(summaryId) => {
            setNewlyCreatedSummary(null);
            handleViewSummary(summaryId);
          }}
        />
      )}

      {/* Real-time Security & Trust Inspector Modal */}
      {showSecurityAudit && (
        <SecurityAuditModal onClose={() => setShowSecurityAudit(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
