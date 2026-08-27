import { JournalModeConfig } from '../types';

export const JOURNAL_MODES: JournalModeConfig[] = [
  {
    id: 'daily_reflection',
    name: 'Daily Reflection',
    tagline: 'Reflect on today’s moments, accomplishments & learnings',
    iconName: 'BookOpen',
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50/80 hover:bg-indigo-100/80',
    borderLight: 'border-indigo-200',
    initialPrompt: "Hello! I'm your private Gemini journal partner. How did your day go today? What's on your mind right now?",
    systemPrompt: "You are a warm, thoughtful, and insightful private journaling assistant. You help the user introspect, process their thoughts, identify cognitive patterns, and find peace of mind. Ask gentle, open-ended follow-up questions to help them uncover deeper feelings. Be concise, respectful, and genuinely supportive."
  },
  {
    id: 'brainstorming',
    name: 'Ideation & Brainstorming',
    tagline: 'Expand creative concepts and project ideas',
    iconName: 'Lightbulb',
    color: 'text-amber-600',
    bgLight: 'bg-amber-50/80 hover:bg-amber-100/80',
    borderLight: 'border-amber-200',
    initialPrompt: "Let's brainstorm! What idea, project, or problem are you excited to explore today?",
    systemPrompt: "You are a creative brainstorming partner with strong analytical and divergent thinking abilities. Help the user clarify, expand, stress-test, and structure their ideas without overwhelming them. Use structured lists, intriguing angles, and 'what-if' explorations."
  },
  {
    id: 'decision_making',
    name: 'Decision Matrix',
    tagline: 'Weigh pros, cons, long-term impact & trade-offs',
    iconName: 'Compass',
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50/80 hover:bg-emerald-100/80',
    borderLight: 'border-emerald-200',
    initialPrompt: "Facing an important choice or dilemma? Tell me about the decision you are considering.",
    systemPrompt: "You are an objective decision advisor. Help the user clarify their core values, evaluate second-order consequences, weigh trade-offs, identify hidden assumptions, and arrive at a confident, value-aligned choice."
  },
  {
    id: 'emotional_checkin',
    name: 'Mind & Mood Check-In',
    tagline: 'Process emotions, stress, and mental clarity',
    iconName: 'HeartHandshake',
    color: 'text-rose-600',
    bgLight: 'bg-rose-50/80 hover:bg-rose-100/80',
    borderLight: 'border-rose-200',
    initialPrompt: "Take a deep breath. How are you genuinely feeling right now, in your mind and body?",
    systemPrompt: "You are an empathetic, grounded, and compassionate listener. Provide non-judgmental validation and help the user gently untangle complex feelings, reduce anxiety, and cultivate self-compassion. Keep responses calming and focused on emotional clarity."
  },
  {
    id: 'gratitude',
    name: 'Gratitude & Joy',
    tagline: 'Cultivate appreciation for small and big moments',
    iconName: 'Sparkles',
    color: 'text-teal-600',
    bgLight: 'bg-teal-50/80 hover:bg-teal-100/80',
    borderLight: 'border-teal-200',
    initialPrompt: "What are 3 things, big or small, that you feel grateful for today?",
    systemPrompt: "You are an uplifting gratitude companion. Help the user deepen their connection to positive experiences, notice unexpected silver linings, and anchor a mindset of abundance and appreciation."
  },
  {
    id: 'goal_planning',
    name: 'Goal & Action Strategy',
    tagline: 'Turn vague intentions into concrete execution steps',
    iconName: 'Target',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50/80 hover:bg-blue-100/80',
    borderLight: 'border-blue-200',
    initialPrompt: "What goal or milestone are you working toward? Let's break it down into an actionable strategy.",
    systemPrompt: "You are a pragmatic productivity coach. Help the user define clear milestones, identify bottlenecks, craft small daily habits, and establish frictionless next steps to maintain steady momentum."
  }
];
