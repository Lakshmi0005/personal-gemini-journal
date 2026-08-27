import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { JournalSession, JournalMessage, JournalSummary, JournalMode } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Creates or updates a journal session record in Firestore under the authenticated user's private path.
 */
export async function saveJournalSession(
  userId: string, 
  session: Partial<JournalSession> & { id: string; mode: JournalMode }
): Promise<void> {
  if (!userId) throw new Error('User ID is required for private data storage');
  
  const path = `users/${userId}/sessions/${session.id}`;
  const sessionRef = doc(db, 'users', userId, 'sessions', session.id);

  const now = Date.now();
  const sessionData: Record<string, any> = {
    id: session.id,
    userId,
    mode: session.mode,
    title: session.title || 'Untitled Journal Session',
    updatedAt: now,
    messageCount: session.messageCount ?? 0,
    status: session.status || 'active',
  };

  if (session.lastMessagePreview !== undefined) {
    sessionData.lastMessagePreview = session.lastMessagePreview;
  }
  if (session.summaryId !== undefined) {
    sessionData.summaryId = session.summaryId;
  }
  if (session.isSummarized !== undefined) {
    sessionData.isSummarized = session.isSummarized;
  }

  try {
    const existingDoc = await getDoc(sessionRef);
    if (!existingDoc.exists()) {
      sessionData.createdAt = session.createdAt || now;
      await setDoc(sessionRef, sessionData);
    } else {
      await updateDoc(sessionRef, sessionData);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Saves a message into the session subcollection `/users/{userId}/sessions/{sessionId}/messages/{messageId}`
 */
export async function saveSessionMessage(
  userId: string, 
  sessionId: string, 
  message: JournalMessage
): Promise<void> {
  if (!userId || !sessionId) throw new Error('Invalid user or session id');

  const path = `users/${userId}/sessions/${sessionId}/messages/${message.id}`;
  const msgRef = doc(db, 'users', userId, 'sessions', sessionId, 'messages', message.id);
  
  try {
    await setDoc(msgRef, {
      id: message.id,
      role: message.role,
      text: message.text,
      timestamp: message.timestamp || Date.now(),
      tokenCount: message.tokenCount || 0
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  // Update parent session metadata
  const sessionPath = `users/${userId}/sessions/${sessionId}`;
  const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
  try {
    await updateDoc(sessionRef, {
      updatedAt: Date.now(),
      lastMessagePreview: message.text.slice(0, 120),
    });
  } catch (err) {
    // Parent doc might not exist yet if created concurrently
  }
}

/**
 * Fetches all sessions belonging to the current user
 */
export async function getUserSessions(userId: string): Promise<JournalSession[]> {
  if (!userId) return [];
  
  const path = `users/${userId}/sessions`;
  try {
    const sessionsCol = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsCol, orderBy('updatedAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    return snap.docs.map(d => d.data() as JournalSession);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Fetches messages for a specific session
 */
export async function getSessionMessages(userId: string, sessionId: string): Promise<JournalMessage[]> {
  if (!userId || !sessionId) return [];

  const path = `users/${userId}/sessions/${sessionId}/messages`;
  try {
    const msgsCol = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
    const q = query(msgsCol, orderBy('timestamp', 'asc'));
    const snap = await getDocs(q);

    return snap.docs.map(d => d.data() as JournalMessage);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Saves a generated journal summary in Firestore under `/users/{userId}/summaries/{summaryId}`
 */
export async function saveJournalSummary(userId: string, summary: JournalSummary): Promise<void> {
  if (!userId) throw new Error('User ID is required');

  const path = `users/${userId}/summaries/${summary.id}`;
  const summaryRef = doc(db, 'users', userId, 'summaries', summary.id);
  
  try {
    await setDoc(summaryRef, {
      ...summary,
      userId,
      createdAt: summary.createdAt || Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  // Link summary to the session
  if (summary.sessionId) {
    const sessionRef = doc(db, 'users', userId, 'sessions', summary.sessionId);
    try {
      await updateDoc(sessionRef, {
        summaryId: summary.id,
        isSummarized: true,
        title: summary.title,
        updatedAt: Date.now(),
        status: 'completed'
      });
    } catch (err) {
      console.warn("Could not update session link with summary:", err);
    }
  }
}

/**
 * Fetches all summaries for the authenticated user
 */
export async function getUserSummaries(userId: string): Promise<JournalSummary[]> {
  if (!userId) return [];

  const path = `users/${userId}/summaries`;
  try {
    const summariesCol = collection(db, 'users', userId, 'summaries');
    const q = query(summariesCol, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);

    return snap.docs.map(d => d.data() as JournalSummary);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Fetches a single summary by ID
 */
export async function getJournalSummary(userId: string, summaryId: string): Promise<JournalSummary | null> {
  if (!userId || !summaryId) return null;

  const path = `users/${userId}/summaries/${summaryId}`;
  try {
    const summaryRef = doc(db, 'users', userId, 'summaries', summaryId);
    const snap = await getDoc(summaryRef);
    if (!snap.exists()) return null;

    return snap.data() as JournalSummary;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Deletes a session and its associated messages
 */
export async function deleteJournalSession(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) return;

  const msgsPath = `users/${userId}/sessions/${sessionId}/messages`;
  try {
    // 1. Delete messages
    const msgsCol = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
    const snap = await getDocs(msgsCol);
    const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    // 2. Delete session doc
    const sessionPath = `users/${userId}/sessions/${sessionId}`;
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, msgsPath);
  }
}

