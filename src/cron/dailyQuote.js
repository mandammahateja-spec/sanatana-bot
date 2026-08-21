import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { COLORS, EMOJIS } from '../../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const quotesPath = path.join(__dirname, '../../../data/gita-quotes.json');

export const postDailyQuote = async (client, guildId, channelId) => {
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    let quotes = [];
    try {
      const data = await fs.readFile(quotesPath, 'utf8');
      quotes = JSON.parse(data);
    } catch (err) {
      console.error('Error reading gita-quotes.json:', err);
      return;
    }

    if (!quotes || quotes.length === 0) return;

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];

    const embed = {
      color: COLORS.GOLD,
      title: `${EMOJIS.BOOK || '📖'} Bhagavad Gita — ${quote.source || 'Verse'}`,
      description: `**Sanskrit**:\n${quote.sanskrit}\n\n**Transliteration**:\n*${quote.transliteration}*\n\n**Meaning**:\n${quote.meaning}`,
      footer: { text: 'Daily Wisdom from Bhagavad Gita' },
      timestamp: new Date().toISOString()
    };

    if (quote.thumbnail) {
      embed.thumbnail = { url: quote.thumbnail };
    }

    await channel.send({ embeds: [embed] });

  } catch (error) {
    console.error(`Error posting daily quote for guild ${guildId}:`, error);
  }
};
