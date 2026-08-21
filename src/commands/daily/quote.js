import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { COLORS, EMOJIS } from '../../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const quotesPath = path.join(__dirname, '../../../data/gita-quotes.json');

export default {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a random quote from the Bhagavad Gita.'),
  category: 'daily',
  execute: async (interaction, context) => {
    try {
      await context.defer();

      let quotes = [];
      try {
        const data = await fs.readFile(quotesPath, 'utf8');
        quotes = JSON.parse(data);
      } catch (err) {
        return context.editReply({ content: 'Sorry, I could not load the quotes at this moment.' });
      }

      if (!quotes || quotes.length === 0) {
        return context.editReply({ content: 'No quotes found.' });
      }

      const randomIndex = Math.floor(Math.random() * quotes.length);
      const quote = quotes[randomIndex];

      const embed = {
        color: COLORS.GOLD,
        title: `${EMOJIS.BOOK || '📖'} Bhagavad Gita — ${quote.source || 'Verse'}`,
        description: `**Sanskrit**:\n${quote.sanskrit}\n\n**Transliteration**:\n*${quote.transliteration}*\n\n**Meaning**:\n${quote.meaning}`,
        footer: { text: 'Spiritual Wisdom' },
        timestamp: new Date().toISOString()
      };

      if (quote.thumbnail) {
        embed.thumbnail = { url: quote.thumbnail };
      }

      await context.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing quote command:', error);
      await context.editReply({ content: 'An error occurred while fetching a quote.' });
    }
  }
};
