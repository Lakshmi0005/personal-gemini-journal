import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import firebaseConfigData from './firebase-applet-config.json';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;
const PROJECT_ID = firebaseConfigData.projectId || process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0957432149';

// Google public keys for Firebase Auth ID token verification
const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

// Valid journal modes whitelist
const VALID_MODES = [
  'daily_reflection',
  'brainstorming',
  'decision_making',
  'emotional_checkin',
  'goal_planning',
  'gratitude'
] as const;

type ValidJournalMode = typeof VALID_MODES[number];

function isValidMode(mode: any): mode is ValidJournalMode {
  return typeof mode === 'string' && VALID_MODES.includes(mode as ValidJournalMode);
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        authProvider?: string;
        isAnonymous?: boolean;
        rawToken?: string;
      };
    }
  }
}

// Lazy initialization of Gemini client (Server-Side Only)
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

/**
 * Authentication Middleware:
 * Verifies Firebase ID Token cryptographically using Google's JWKS public keys.
 * STRICT ENFORCEMENT: Never falls back to unverified decodeJwt().
 */
async function authenticateFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header with Bearer token' });
    return;
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Empty token provided' });
    return;
  }

  try {
    const expectedIssuer = `https://securetoken.google.com/${PROJECT_ID}`;
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: expectedIssuer,
      audience: PROJECT_ID,
    });

    const uid = payload.sub;
    if (!uid || typeof uid !== 'string') {
      res.status(401).json({ error: 'Unauthorized: Token is missing valid subject claim' });
      return;
    }

    const fbClaim = payload.firebase as Record<string, any> | undefined;
    req.user = {
      uid: String(uid),
      email: payload.email ? String(payload.email) : undefined,
      authProvider: fbClaim?.sign_in_provider ? String(fbClaim.sign_in_provider) : undefined,
      isAnonymous: fbClaim?.sign_in_provider === 'anonymous' || !payload.email,
      rawToken: token,
    };

    next();
  } catch (err: any) {
    // Cryptographic signature check or claim verification failed.
    // Strictly reject without fallback.
    console.warn('[Auth] Token cryptographic verification failed:', err?.code || 'Invalid signature');
    res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase authentication token' });
  }
}

/**
 * Parse configured allowed origins for CORS.
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  if (process.env.APP_URL) {
    origins.push(process.env.APP_URL.trim());
  }

  if (process.env.ALLOWED_ORIGINS) {
    const custom = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
    origins.push(...custom);
  }

  // Common development origins
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173');
  }

  return Array.from(new Set(origins));
}

interface ContentTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Normalizes multi-turn message history for Gemini API:
 * 1. Filters out empty messages
 * 2. Ensures conversation starts with a 'user' role
 * 3. Safely merges consecutive user messages into a single user turn
 * 4. Safely merges consecutive model messages into a single model turn
 * 5. Appends the new current user message correctly
 */
function buildGeminiContents(
  history: Array<{ role: string; text?: string }> | undefined,
  currentMessage: string
): ContentTurn[] {
  const rawList: Array<{ role: 'user' | 'model'; text: string }> = [];

  if (Array.isArray(history)) {
    // Limit conversation context to last 30 items
    const boundedHistory = history.slice(-30);
    for (const item of boundedHistory) {
      if (!item || typeof item !== 'object') continue;
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) continue; // Ignore empty messages

      const role: 'user' | 'model' = item.role === 'model' ? 'model' : 'user';
      rawList.push({ role, text });
    }
  }

  // Append the current new user message
  const trimmedCurrent = typeof currentMessage === 'string' ? currentMessage.trim() : '';
  if (trimmedCurrent) {
    rawList.push({ role: 'user', text: trimmedCurrent });
  }

  // Drop leading 'model' turns so multi-turn starts with 'user'
  while (rawList.length > 0 && rawList[0].role === 'model') {
    rawList.shift();
  }

  // Safety fallback if empty
  if (rawList.length === 0) {
    rawList.push({ role: 'user', text: trimmedCurrent || 'Hello' });
  }

  // Merge consecutive turns with the same role into alternating turns
  const contents: ContentTurn[] = [];

  for (const item of rawList) {
    const lastTurn = contents[contents.length - 1];
    if (lastTurn && lastTurn.role === item.role) {
      lastTurn.parts.push({ text: item.text });
    } else {
      contents.push({
        role: item.role,
        parts: [{ text: item.text }]
      });
    }
  }

  return contents;
}

async function startServer() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  // Basic request body parser with size limit
  app.use(express.json({ limit: '1mb' }));

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Explicit CORS Middleware (No Wildcard '*')
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Check if origin is allowed or if request is same-origin
    let isOriginAllowed = false;
    if (!origin) {
      // Same-origin request (e.g. direct fetch from served SPA)
      isOriginAllowed = true;
    } else if (allowedOrigins.includes(origin)) {
      isOriginAllowed = true;
    } else if (origin.endsWith('.run.app') && (origin.includes('ais-dev-') || origin.includes('ais-pre-') || origin.includes(PROJECT_ID))) {
      // Allowed AI Studio Cloud Run preview and dev domains
      isOriginAllowed = true;
    }

    if (origin && isOriginAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      if (isOriginAllowed) {
        res.status(204).end();
      } else {
        res.status(403).json({ error: 'CORS origin not allowed' });
      }
      return;
    }

    next();
  });

  // Health endpoint (Public)
  app.get('/api/health', (req, res) => {
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const isSecretManager = process.env.SECRET_MANAGER_ENABLED === 'true';

    res.json({
      status: 'ok',
      service: 'Personal Gemini Journal API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      security: {
        geminiConfigured: hasGeminiKey,
        secretSource: isSecretManager ? 'secret_manager' : (hasGeminiKey ? 'environment_variable' : 'missing'),
        projectId: PROJECT_ID,
      }
    });
  });

  // Security Audit Diagnostic Endpoint (Authenticated Only)
  app.get('/api/security/audit', authenticateFirebaseToken, (req: Request, res: Response) => {
    const user = req.user!;
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    const isSecretManager = process.env.SECRET_MANAGER_ENABLED === 'true';

    res.json({
      authenticated: true,
      uid: user.uid,
      email: user.email || 'Anonymous/Guest',
      authProvider: user.authProvider || 'firebase',
      tokenIssuer: `https://securetoken.google.com/${PROJECT_ID}`,
      tokenValid: true,
      verificationMethod: 'cryptographic_jwks_signature',
      serverTime: new Date().toISOString(),
      secretStatus: {
        geminiKeyConfigured: hasGeminiKey,
        source: isSecretManager ? 'secret_manager' : (hasGeminiKey ? 'environment_variable' : 'missing'),
        secretManagerActive: isSecretManager,
        clientExposed: false
      },
      firestorePathIsolation: `/users/${user.uid}/...`,
      corsEnforced: true,
      securityHeadersActive: true
    });
  });

  // Multi-Turn Chat Endpoint (Authenticated Only)
  app.post('/api/chat', authenticateFirebaseToken, async (req: Request, res: Response) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { message, history, mode, sessionId } = req.body;

      // 1. Validate Message Content
      if (typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message content must be a non-empty string' });
      }

      if (message.length > 5000) {
        return res.status(400).json({ error: 'Message exceeds maximum allowable length (5,000 characters)' });
      }

      // 2. Validate Mode
      const selectedMode: ValidJournalMode = isValidMode(mode) ? mode : 'daily_reflection';

      // 3. Validate Session ID if provided
      if (sessionId !== undefined && (typeof sessionId !== 'string' || sessionId.length > 128)) {
        return res.status(400).json({ error: 'Invalid session identifier' });
      }

      const ai = getGemini();

      // Mode-specific system guidance
      let modeGuidance = "You are a warm, thoughtful, and insightful private journaling assistant. You help the user introspect, process their thoughts, identify cognitive patterns, and find peace of mind.";
      if (selectedMode === 'brainstorming') {
        modeGuidance = "You are a creative brainstorming partner with strong analytical and divergent thinking abilities. Help the user clarify, expand, stress-test, and structure their ideas without overwhelming them.";
      } else if (selectedMode === 'decision_making') {
        modeGuidance = "You are an objective decision advisor. Help the user clarify their core values, evaluate second-order consequences, weigh trade-offs, identify hidden assumptions, and arrive at a confident, value-aligned choice.";
      } else if (selectedMode === 'emotional_checkin') {
        modeGuidance = "You are an empathetic, grounded, and compassionate listener. Provide non-judgmental validation and help the user gently untangle complex feelings, reduce anxiety, and cultivate self-compassion.";
      } else if (selectedMode === 'gratitude') {
        modeGuidance = "You are an uplifting gratitude companion. Help the user deepen their connection to positive experiences, notice unexpected silver linings, and anchor a mindset of abundance and appreciation.";
      } else if (selectedMode === 'goal_planning') {
        modeGuidance = "You are a pragmatic productivity coach. Help the user define clear milestones, identify bottlenecks, craft small daily habits, and establish frictionless next steps.";
      }

      const systemInstruction = `${modeGuidance}
Strict Privacy & Security Directives:
1. Treat all user thoughts as strictly confidential and private.
2. Ask 1 or 2 high-leverage, open-ended questions to invite the user to dig deeper.
3. Keep responses concise, warm, structured with readable Markdown, and non-prescriptive.
4. Do not offer medical, psychiatric, legal, or financial diagnosis.`;

      // 4. Validate history format if provided
      if (history !== undefined) {
        if (!Array.isArray(history)) {
          return res.status(400).json({ error: 'History must be an array of messages' });
        }
        for (const item of history) {
          if (!item || typeof item !== 'object') {
            return res.status(400).json({ error: 'Invalid history item format' });
          }
          if (item.role !== 'user' && item.role !== 'model') {
            return res.status(400).json({ error: 'Invalid role in message history' });
          }
          if (typeof item.text !== 'string' || item.text.length > 5000) {
            return res.status(400).json({ error: 'Invalid text in message history (max 5,000 chars per item)' });
          }
        }
      }

      // Construct normalized contents alternating between user and model
      const contents = buildGeminiContents(history, message);

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "Thank you for sharing your thoughts. What aspect of this stands out to you the most right now?";

      res.json({
        reply: replyText,
        timestamp: Date.now()
      });
    } catch (err: any) {
      console.error('[Chat] Generation error:', err);

      res.status(500).json({
        error: 'Failed to process journal conversation.',
        details: err?.message || String(err)
      });
    }
  });

  // Automated Journal Summarization Endpoint (Authenticated Only)
  app.post('/api/summarize', authenticateFirebaseToken, async (req: Request, res: Response) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const { messages, mode, sessionId } = req.body;
      const user = req.user!; // Authoritative identity derived strictly from verified JWT

      // 1. Validate Messages array
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'At least one message is required to generate a summary' });
      }

      if (messages.length > 100) {
        return res.status(400).json({ error: 'Too many messages in summary request (max 100)' });
      }

      for (const m of messages) {
        if (!m || typeof m !== 'object' || (m.role !== 'user' && m.role !== 'model') || typeof m.text !== 'string') {
          return res.status(400).json({ error: 'Malformed message in summary input array' });
        }
        if (m.text.length > 5000) {
          return res.status(400).json({ error: 'Individual message exceeds 5,000 character limit' });
        }
      }

      // 2. Validate Mode and SessionId
      const selectedMode: ValidJournalMode = isValidMode(mode) ? mode : 'daily_reflection';
      const cleanSessionId = typeof sessionId === 'string' && sessionId.length <= 128 ? sessionId : `ses_${Date.now()}`;

      const ai = getGemini();

      // Format conversation transcript
      const transcript = messages
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Gemini'}: ${m.text}`)
        .join('\n\n');

      const prompt = `Analyze this private journal conversation and produce an insightful, structured reflection summary.

CONVERSATION TRANSCRIPT:
${transcript.slice(0, 15000)}

Please return a valid JSON object matching this exact schema:
{
  "title": "A concise, evocative 4-8 word title for this journal session",
  "overview": "A 2-3 sentence executive summary synthesizing the user's primary reflections and breakthrough moments.",
  "keyThemes": ["3 to 5 short tags/themes summarizing topics explored"],
  "actionItems": ["2 to 4 tangible takeaways, commitments, or next steps identified"],
  "moodInsights": "A concise assessment of emotional tone, cognitive state, or clarity shift (e.g. 'Started overwhelmed, achieved clarity and calm focus')",
  "followUpQuestions": ["2 deep, open-ended reflection questions for the user's future journal session"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        }
      });

      let parsed: any;
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch {
        parsed = {
          title: 'Journal Session Reflections',
          overview: 'Comprehensive reflection on thoughts and concepts discussed during this private journal session.',
          keyThemes: ['Self-Reflection', 'Personal Growth'],
          actionItems: ['Review discussed perspectives and take small actionable steps.'],
          moodInsights: 'Thoughtful and introspective.',
          followUpQuestions: ['What is one small action you can take today?']
        };
      }

      const summaryId = `sum_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const summaryResult = {
        id: summaryId,
        sessionId: cleanSessionId,
        userId: user.uid, // Explicitly enforce authoritative verified UID
        title: typeof parsed.title === 'string' ? parsed.title : 'Journal Reflection',
        overview: typeof parsed.overview === 'string' ? parsed.overview : 'Summary of journal conversation.',
        keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes.slice(0, 10) : ['Reflection'],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.slice(0, 10) : ['Reflect on key takeaways'],
        moodInsights: typeof parsed.moodInsights === 'string' ? parsed.moodInsights : 'Calm and reflective',
        followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.slice(0, 10) : ['How can you build on this progress?'],
        createdAt: Date.now(),
        messageCount: messages.length,
        mode: selectedMode
      };

      res.json(summaryResult);
    } catch (err: any) {
      console.error('[Summary] Generation error:', err?.message || 'Unknown error');
      res.status(500).json({ 
        error: 'Failed to generate session summary. Please check your connection and try again.' 
      });
    }
  });

  // Personal AI Journey Endpoint (Authenticated Only - Synthesizes User's Saved Summaries)
  app.post('/api/journey', authenticateFirebaseToken, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user || !user.uid) {
        return res.status(401).json({ error: 'Unauthorized: Missing user authentication context' });
      }

      const rawSummaries = Array.isArray(req.body?.summaries) ? req.body.summaries : [];
      const sessionCount = typeof req.body?.sessionCount === 'number' ? req.body.sessionCount : rawSummaries.length;

      // Filter and sanitize summaries belonging to the user
      const userSummaries = rawSummaries
        .filter((s: any) => s && typeof s === 'object' && (!s.userId || s.userId === user.uid))
        .slice(0, 10);

      // If user has no summaries, return empty journey state directly
      if (userSummaries.length === 0) {
        return res.json({
          totalSessions: sessionCount,
          recurringThemes: [],
          growthInsight: "You haven't completed any journal reflection summaries yet. Start a session and click 'Finish & Summarize' to begin charting your AI Journey.",
          openActionCommitments: [],
          journeyReflectionPrompts: [
            "What is the most important thought or priority on your mind today?",
            "What kind of progress would make you feel accomplished by the end of this week?"
          ],
          analyzedAt: Date.now()
        });
      }

      // Prepare concise digest of summaries for Gemini synthesis
      const summariesDigest = userSummaries.map((s: any, idx: number) => ({
        index: idx + 1,
        mode: typeof s.mode === 'string' ? s.mode : 'reflection',
        title: typeof s.title === 'string' ? s.title.slice(0, 100) : 'Untitled Session',
        date: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'Recent',
        overview: typeof s.overview === 'string' ? s.overview.slice(0, 500) : '',
        keyThemes: Array.isArray(s.keyThemes) ? s.keyThemes.slice(0, 8).map((t: any) => String(t)) : [],
        actionItems: Array.isArray(s.actionItems) ? s.actionItems.slice(0, 8).map((a: any) => String(a)) : [],
        moodInsights: typeof s.moodInsights === 'string' ? s.moodInsights.slice(0, 300) : ''
      }));

      const ai = getGemini();
      const prompt = `You are an insightful personal growth and executive journaling mentor. Analyze this series of ${summariesDigest.length} saved reflection summaries for an authenticated user to identify their overarching journey trajectory, recurring growth patterns, commitments, and proactive prompts.

SAVED USER SUMMARIES DIGEST:
${JSON.stringify(summariesDigest, null, 2)}

TASK:
Produce a single valid JSON object strictly matching this schema:
{
  "recurringThemes": [
    { "theme": "string (e.g. Technical Growth, Emotional Balance, Project Execution)", "count": number (approximate occurrence count) }
  ],
  "growthInsight": "string (2-3 sentences synthesizing recent trajectory, shifts in confidence, challenges overcome, or evolving mindset)",
  "openActionCommitments": [
    "string (up to 5 distinct, meaningful, high-impact action commitments extracted across the summaries)"
  ],
  "journeyReflectionPrompts": [
    "string (2-3 forward-looking, open-ended coaching questions tailored to their overarching themes and next milestones)"
  ]
}

Strict Rules:
1. Base your synthesis ONLY on the provided summaries.
2. Ensure empathetic, professional, motivating, and highly personalized tone.
3. Return strictly valid parseable JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        }
      });

      let parsed: any;
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch {
        parsed = {
          recurringThemes: [
            { theme: 'Self-Reflection', count: userSummaries.length },
            { theme: 'Personal Growth', count: Math.max(1, Math.floor(userSummaries.length * 0.8)) }
          ],
          growthInsight: 'Your recent sessions reflect a continuous commitment to self-inquiry and structured goal alignment.',
          openActionCommitments: ['Review recent takeaways and maintain consistent reflection habits.'],
          journeyReflectionPrompts: ['What patterns have you noticed in your recent reflections that surprise you?']
        };
      }

      // Format recurring themes
      const recurringThemes = Array.isArray(parsed.recurringThemes)
        ? parsed.recurringThemes.slice(0, 6).map((item: any) => ({
            theme: typeof item.theme === 'string' ? item.theme : String(item),
            count: typeof item.count === 'number' ? item.count : 1
          }))
        : [];

      const openActionCommitments = Array.isArray(parsed.openActionCommitments)
        ? parsed.openActionCommitments.filter((a: any) => typeof a === 'string' && a.trim()).slice(0, 5)
        : [];

      const journeyReflectionPrompts = Array.isArray(parsed.journeyReflectionPrompts)
        ? parsed.journeyReflectionPrompts.filter((p: any) => typeof p === 'string' && p.trim()).slice(0, 4)
        : [
            "What is one key lesson from your recent reflections that you want to apply tomorrow?",
            "How has your perspective on your current priorities evolved over your last few sessions?"
          ];

      const journeyResult = {
        totalSessions: Math.max(sessionCount, userSummaries.length),
        recurringThemes,
        growthInsight: typeof parsed.growthInsight === 'string' && parsed.growthInsight.trim()
          ? parsed.growthInsight.trim()
          : "Your recent journal summaries show steady engagement with thoughtful reflection and intentional problem-solving.",
        openActionCommitments,
        journeyReflectionPrompts,
        analyzedAt: Date.now()
      };

      res.json(journeyResult);
    } catch (err: any) {
      console.error('[Journey] Generation error:', err?.message || 'Unknown error');
      res.status(500).json({
        error: 'Failed to analyze your personal AI journey. Please try again in a moment.'
      });
    }
  });

  // Global API 404 handler
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Personal Gemini Journal] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Security] Firebase Project ID: ${PROJECT_ID}`);
    console.log(`[Security] Gemini API key configured: ${!!process.env.GEMINI_API_KEY}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
