import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { COLORS, EMOJIS } from '../../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shlokasPath = path.join(__dirname, '../../../data/shlokas.json');

export default {
  data: new SlashCommandBuilder()
    .setName('shloka')
    .setDescription('Display a random shloka from the Bhagavad Gita.'),
  category: 'daily',
  execute: async (interaction, context) => {
    try {
      await context.defer();

      let shlokas = [];
      try {
        const data = await fs.readFile(shlokasPath, 'utf8');
        shlokas = JSON.parse(data);
      } catch (err) {
        return context.editReply({ content: 'Sorry, I could not load the shlokas at this moment.' });
      }

      if (!shlokas || shlokas.length === 0) {
        return context.editReply({ content: 'No shlokas found.' });
      }

      const randomIndex = Math.floor(Math.random() * shlokas.length);
      const shloka = shlokas[randomIndex];

      const embed = {
        color: COLORS.SAFFRON,
        title: `${EMOJIS.OM || '🕉️'} Shloka of the moment`,
        fields: [
          { name: 'Source', value: shloka.source || 'Bhagavad Gita' },
          { name: 'Sanskrit', value: `\`\`\`\n${shloka.sanskrit}\n\`\`\`` },
          { name: 'Transliteration', value: `*${shloka.transliteration}*` },
          { name: 'Meaning', value: shloka.meaning }
        ],
        footer: { text: `Sanatana Dharma Bot` },
        timestamp: new Date().toISOString()
      };

      await context.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing shloka command:', error);
      await context.editReply({ content: 'An error occurred while fetching a shloka.' });
    }
  }
};
