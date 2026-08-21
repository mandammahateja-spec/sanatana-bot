import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let slogans = [];
try {
  const slogansPath = path.join(__dirname, '../../data/slogans.json');
  if (fs.existsSync(slogansPath)) {
    const data = fs.readFileSync(slogansPath, 'utf-8');
    slogans = JSON.parse(data);
  }
} catch (error) {
  console.error('Error loading slogans:', error);
}

// In-memory map for cooldowns (userId -> timestamp)
const cooldowns = new Map();
const COOLDOWN_TIME = 10000; // 10 seconds

export async function handleSloganReply(message, client) {
  if (slogans.length === 0) return false;

  // Assuming auto_reply_enabled is true (can be fetched from DB later)
  const autoReplyEnabled = true; 
  const autoReplyMode = 'reply'; // or 'react'

  if (!autoReplyEnabled) return false;

  const now = Date.now();
  if (cooldowns.has(message.author.id)) {
    const lastReply = cooldowns.get(message.author.id);
    if (now - lastReply < COOLDOWN_TIME) {
      return false; // Cooldown active
    }
  }

  const content = message.content.toLowerCase();
  let matchedSlogan = null;

  for (const slogan of slogans) {
    if (!slogan.triggers || !Array.isArray(slogan.triggers)) continue;
    
    for (const trigger of slogan.triggers) {
      const regex = new RegExp(`\\b${trigger}\\b`, 'i');
      if (regex.test(content)) {
        matchedSlogan = slogan;
        break;
      }
    }
    if (matchedSlogan) break;
  }

  if (matchedSlogan) {
    cooldowns.set(message.author.id, now);
    try {
      if (autoReplyMode === 'react' && matchedSlogan.emoji) {
        await message.react(matchedSlogan.emoji);
      } else if (matchedSlogan.response) {
        await message.reply(matchedSlogan.response);
      }
      return true;
    } catch (error) {
      console.error('Error replying to slogan:', error);
    }
  }

  return false;
}
