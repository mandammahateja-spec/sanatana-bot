/**
 * 🕉️ Sanatana Bot — Constants & Configuration
 */

// Embed color theme (saffron/gold Hindu spiritual aesthetic)
export const COLORS = {
  SAFFRON: 0xFF9933,
  GOLD: 0xFFD700,
  MAROON: 0x800000,
  GREEN: 0x228B22,
  RED: 0xFF0000,
  BLUE: 0x1E90FF,
  WHITE: 0xFFFFFF,
};

// Commonly used emojis
export const EMOJIS = {
  OM: '🕉️',
  PRAY: '🙏',
  TRIDENT: '🔱',
  BELL: '🔔',
  LOTUS: '🪷',
  FIRE: '🔥',
  STAR: '⭐',
  SUN: '☀️',
  MOON: '🌙',
  MUSIC: '🎵',
  SPEAKER: '🔊',
  BOOK: '📖',
  SCROLL: '📜',
  TROPHY: '🏆',
  CHECK: '✅',
  CROSS: '❌',
  WARNING: '⚠️',
  SHIELD: '🛡️',
  HAMMER: '🔨',
  CLOCK: '⏰',
  SPARKLE: '✨',
  HEART: '❤️',
  MEDITATION: '🧘',
  TEMPLE: '🛕',
};

// Default bot prefix (case-insensitive matching done in handler)
export const DEFAULT_PREFIX = 'jai';

// Default timezone
export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';

// Cooldown defaults (in milliseconds)
export const COOLDOWNS = {
  SLOGAN_REPLY: 10_000,       // 10 seconds per user
  GEMINI_ASK: 30_000,         // 30 seconds per user
  COMMAND_DEFAULT: 3_000,     // 3 seconds per user per command
  QUIZ: 5_000,                // 5 seconds between quiz attempts
};

// Gemini configuration
export const GEMINI_CONFIG = {
  MODEL: 'gemini-3.6-flash',
  MAX_TOKENS: 500,
  SYSTEM_PROMPT: `You are a knowledgeable and respectful guide on Sanatana Dharma (Hinduism). 
You answer questions about Hindu scriptures (Vedas, Upanishads, Bhagavad Gita, Puranas, Ramayana, Mahabharata), 
philosophy (Advaita, Dvaita, Vishishtadvaita), practices (yoga, meditation, puja), deities, festivals, and culture.

Guidelines:
- Be accurate and cite specific scripture references (chapter, verse) when possible
- If you're unsure about a specific reference, say so honestly rather than fabricating one
- Stay respectful to all traditions within Sanatana Dharma
- Keep answers concise (under 500 words) but informative
- Use Sanskrit terms with English translations in parentheses
- Do not engage in comparative religion debates or criticism of other faiths
- If asked about something outside your scope, politely redirect to Sanatana Dharma topics`,
};

// Music player settings
export const MUSIC = {
  MAX_QUEUE_SIZE: 50,
  IDLE_TIMEOUT: 300_000,      // 5 minutes
  DEFAULT_VOLUME: 0.5,
  SEARCH_RESULTS: 5,
};

// Pagination
export const PAGINATION = {
  ITEMS_PER_PAGE: 10,
  TIMEOUT: 120_000,           // 2 minutes for button interactions
};

// Moderation
export const MOD = {
  MAX_CLEAR: 100,
  WARN_THRESHOLD: 3,          // optional: auto-action after N warnings
};
