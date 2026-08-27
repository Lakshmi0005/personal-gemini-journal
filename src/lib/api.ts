import { getIdToken } from './firebase';
import { JournalMessage, JournalMode, JournalSummary, PersonalAIJourney, SecurityAuditData } from '../types';

export interface ChatApiRequest {
  sessionId: string;
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  mode: JournalMode;
}

export interface ChatApiResponse {
  reply: string;
  timestamp: number;
}

export interface SummarizeApiRequest {
  sessionId: string;
  mode: JournalMode;
  messages: Array<{ role: 'user' | 'model'; text: string }>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  if (!token) {
    throw new ApiError('Authentication token missing. Please sign in.', 401);
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const data = await response.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      // Ignored
    }
    throw new ApiError(errorMsg, response.status);
  }

  return response;
}

/**
 * Sends a message to the secure server Gemini API endpoint
 */
export async function sendChatMessage(payload: ChatApiRequest): Promise<ChatApiResponse> {
  const res = await fetchWithAuth('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return await res.json();
}

/**
 * Generates an automatic structured summary of the session via Gemini API
 */
export async function generateSessionSummary(payload: SummarizeApiRequest): Promise<JournalSummary> {
  const res = await fetchWithAuth('/api/summarize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return await res.json();
}

/**
 * Fetches real-time server security & token audit diagnostic
 */
export async function getSecurityAudit(): Promise<SecurityAuditData> {
  const res = await fetchWithAuth('/api/security/audit', {
    method: 'GET',
  });
  return await res.json();
}

/**
 * Fetches authenticated user's synthesized Personal AI Journey analysis
 */
export async function fetchPersonalAIJourney(
  summaries: JournalSummary[] = [],
  sessionCount?: number
): Promise<PersonalAIJourney> {
  const res = await fetchWithAuth('/api/journey', {
    method: 'POST',
    body: JSON.stringify({
      summaries,
      sessionCount,
    }),
  });
  return await res.json();
}

