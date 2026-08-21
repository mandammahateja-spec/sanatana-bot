# 🕉️ Sanatana Bot — Discord Bot for Sanatana Dharma Communities

A full-featured Discord bot for Hindu spiritual community servers, featuring bhajan playback, daily shlokas, quizzes, Gemini-powered Q&A, moderation tools, and more.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![Supabase](https://img.shields.io/badge/Database-Supabase-darkgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🎵 Bhajan & Devotional Music Player
- Play bhajans/aartis from YouTube with queue management
- Curated playlists by deity (Krishna, Shiva, Hanuman, Devi, Ganesha, Rama)
- Loop, skip, pause, resume controls
- Specific aarti playback (Ganga Aarti, Om Jai Jagdish Hare, etc.)
- 24/7 "Bhajan Lounge" auto-play mode for admins

### 📿 Daily Spiritual Content (Auto-posted via Cron)
- Daily shloka (Sanskrit + transliteration + meaning) from Gita, Upanishads, Vedas
- Daily Bhagavad Gita quote
- Hindu Panchang (tithi, nakshatra, sunrise/sunset)
- Festival reminders posted a day before (Diwali, Navratri, Shivratri, etc.)

### 📖 Knowledge & Engagement
- Interactive quizzes (Mahabharata, Ramayana, Gita) with leaderboard
- Full Chalisa texts (Hanuman, Durga, Shiv, Ganesh)
- Mantra reference with meanings
- Short stories from epics and Puranas
- Gemini AI-powered Q&A on scriptures and Dharma

### 🛕 Community & Utility
- Meditation timer with bell notifications
- Temple darshan/aarti timings lookup
- Reaction roles (Bhakti, Gyaan, Karma Yoga paths)
- Spiritual greeting auto-replies (Jai Shree Krishna, Har Har Mahadev, etc.)
- Welcome messages for new members

### 🛡️ Moderation Suite
- Kick, ban, unban, timeout, mute, warn
- Warning history & moderation logs
- Bulk message deletion & per-user purge
- Channel lock/unlock & slowmode
- All actions logged to database + configurable mod-log channel

### ⚙️ Admin Controls
- Configure daily post channels, timezone, mod-log channel
- Toggle features on/off per server
- Multi-guild support from day one

---

## 🚀 Setup Guide

### Prerequisites
- **Node.js 18+** ([download](https://nodejs.org/))
- **FFmpeg** ([download](https://ffmpeg.org/download.html)) — required for voice/audio playback
- **Discord Application** with bot token
- **Supabase** project (free tier works)
- **Google Gemini API key** (free tier available)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd sanatana-bot
npm install
```

### 2. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → name it (e.g., "Sanatana Bot")
3. Go to **Bot** tab:
   - Click **"Add Bot"**
   - Copy the **Token** → save for `.env`
   - Enable these **Privileged Gateway Intents**:
     - ✅ Presence Intent
     - ✅ Server Members Intent
     - ✅ Message Content Intent
4. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (or select individually: Send Messages, Manage Messages, Kick/Ban Members, Manage Channels, Connect, Speak, Embed Links, Add Reactions, Use Slash Commands)
   - Copy the generated URL and open it to invite the bot to your server

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API**:
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **service_role key** (secret!) → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor**, paste the contents of `src/migrations/001_initial_schema.sql`, and **Run**
4. Verify tables were created in the **Table Editor**

### 4. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key → `GEMINI_API_KEY`

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_application_client_id
GUILD_ID=your_server_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
DEFAULT_TIMEZONE=Asia/Kolkata
```

### 6. Deploy Slash Commands

```bash
# Deploy to your development server (fast, instant)
npm run deploy-commands

# Deploy globally (takes up to 1 hour to propagate)
npm run deploy-commands:global
```

### 7. Start the Bot

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

---

## 📁 Project Structure

```
sanatana-bot/
├── src/
│   ├── commands/
│   │   ├── admin/          (config, toggle)
│   │   ├── bhajan/         (play, queue, skip, pause, resume, stop, loop, aarti, lounge)
│   │   ├── daily/          (shloka, panchang, quote)
│   │   ├── knowledge/      (quiz, leaderboard, chalisa, mantra, story, ask)
│   │   ├── moderation/     (kick, ban, timeout, warn, clear, lock, mute, etc.)
│   │   └── utility/        (help, meditate, temple, donate, roles)
│   ├── events/             (ready, messageCreate, interactionCreate, guildMemberAdd)
│   ├── handlers/           (commandHandler, prefixHandler, sloganHandler)
│   ├── models/             (guildConfig, modLog, quizScore — Supabase DAL)
│   ├── services/           (musicService, panchangService, geminiService, modLogService)
│   ├── cron/               (scheduler, dailyShloka, dailyQuote, festivalReminder)
│   ├── config/             (constants, supabase client)
│   ├── migrations/         (SQL schema for Supabase)
│   ├── deploy-commands.js
│   └── index.js
├── data/                   (JSON data files — shlokas, chalisas, quizzes, etc.)
├── .env.example
├── package.json
└── README.md
```

---

## 🎮 Commands Reference

### Using Commands
All commands work via **both** slash commands and the **"jai"** prefix:

```
/bhajan play krishna bhajan     ← slash command
jai bhajan play krishna bhajan  ← prefix command (case-insensitive)
```

### Command Categories

| Category | Commands |
|----------|----------|
| **🎵 Bhajan & Music** | `bhajan play/queue/skip/pause/resume/stop/loop`, `aarti`, `lounge` |
| **📿 Daily Content** | `shloka`, `panchang`, `quote` |
| **📖 Knowledge** | `quiz`, `leaderboard`, `chalisa`, `mantra`, `story`, `ask` |
| **🛕 Utility** | `help`, `meditate`, `temple-timing`, `donate-info`, `setup-roles` |
| **🛡️ Moderation** | `kick`, `ban`, `unban`, `timeout`, `untimeout`, `warn`, `warnings`, `clear`, `lock`, `unlock`, `slowmode`, `purge-user`, `mute`, `unmute`, `modlogs` |
| **⚙️ Admin** | `config`, `toggle` |

Use `jai help` or `/help` for the full interactive command list.

---

## 📝 Customizing Content

### Adding Shlokas
Edit `data/shlokas.json` — each entry:
```json
{
  "id": 1,
  "source": "Bhagavad Gita",
  "chapter": "2",
  "verse": "47",
  "sanskrit": "कर्मण्येवाधिकारस्ते...",
  "transliteration": "Karmanye vadhikaraste...",
  "meaning": "You have the right to work only...",
  "deity": "Krishna"
}
```

### Adding Quiz Questions
Edit `data/quiz-questions.json`:
```json
{
  "id": 1,
  "question": "Who was Arjuna's charioteer?",
  "options": ["Krishna", "Shalya", "Karna", "Drona"],
  "correct": 0,
  "source": "Mahabharata",
  "difficulty": "easy",
  "explanation": "Lord Krishna served as Arjuna's charioteer..."
}
```

### Adding Auto-Reply Slogans
Edit `data/slogans.json`:
```json
{
  "triggers": ["jai shree krishna"],
  "reply": "🙏 Jai Shree Krishna!",
  "emoji": "🙏"
}
```

### Adding Festivals
Edit `data/festivals.json` — update dates annually:
```json
{
  "name": "Diwali",
  "date": "10-20",
  "year": 2025,
  "description": "Festival of lights celebrating the victory of light over darkness",
  "emoji": "🪔",
  "deity": "Lakshmi"
}
```

---

## 🚢 Deployment

### Railway
1. Push to GitHub
2. Connect repo in [Railway](https://railway.app)
3. Add environment variables in Railway dashboard
4. Add FFmpeg buildpack or use a Dockerfile

### Render
1. Push to GitHub
2. Create a new **Background Worker** in [Render](https://render.com)
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables
6. Note: Install FFmpeg via a custom Docker image or build script

### VPS (Ubuntu)
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs ffmpeg

# Clone and setup
git clone <repo> && cd sanatana-bot
npm install
cp .env.example .env
nano .env  # fill in values

# Run with PM2 (process manager)
npm install -g pm2
pm2 start src/index.js --name sanatana-bot
pm2 save
pm2 startup
```

---

## ⚠️ Important Notes

- **Scripture Content**: Review `data/*.json` files before going live — scripture accuracy deserves care. Have a knowledgeable community member verify shlokas, mantras, and chalisas.
- **YouTube Playback**: `play-dl` is used for streaming. YouTube may occasionally break playback; the music service handles errors gracefully.
- **Gemini Rate Limits**: Free tier has limits. Per-user cooldowns (30s) are built in to prevent spam.
- **FFmpeg Required**: Voice features won't work without FFmpeg installed on the host.
- **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` publicly — it bypasses Row Level Security.

---

## 📄 License

MIT — built with 🙏 for the Sanatana Dharma community.

🕉️ *Jai Shree Krishna!*
