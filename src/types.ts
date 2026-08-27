export type JournalMode = 
  | 'daily_reflection'
  | 'brainstorming'
  | 'decision_making'
  | 'emotional_checkin'
  | 'goal_planning'
  | 'gratitude';

export interface JournalModeConfig {
  id: JournalMode;
  name: string;
  tagline: string;
  iconName: string;
  color: string;
  bgLight: string;
  borderLight: string;
  initialPrompt: string;
  systemPrompt: string;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  tokenCount?: number;
}

export interface JournalSummary {
  id: string;
  sessionId: string;
  userId: string;
  title: string;
  overview: string;
  keyThemes: string[];
  actionItems: string[];
  moodInsights: string;
  followUpQuestions: string[];
  createdAt: number;
  messageCount: number;
  mode: JournalMode;
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  mode: JournalMode;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview?: string;
  summaryId?: string;
  isSummarized?: boolean;
  status: 'active' | 'completed' | 'archived';
}

export interface SecurityAuditData {
  authenticated: boolean;
  uid: string;
  email?: string;
  authProvider?: string;
  tokenIssuer: string;
  tokenValid: boolean;
  verificationMethod: string;
  serverTime: string;
  secretStatus: {
    geminiKeyConfigured: boolean;
    source: 'secret_manager' | 'environment_variable' | 'missing';
    secretManagerActive: boolean;
    clientExposed: boolean;
  };
  firestorePathIsolation: string;
  corsEnforced: boolean;
  securityHeadersActive: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: number;
  lastLoginAt: number;
}

export interface RecurringThemeItem {
  theme: string;
  count: number;
}

export interface PersonalAIJourney {
  totalSessions: number;
  recurringThemes: RecurringThemeItem[];
  growthInsight: string;
  openActionCommitments: string[];
  journeyReflectionPrompts: string[];
  analyzedAt: number;
}
