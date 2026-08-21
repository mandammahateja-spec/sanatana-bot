import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('story')
    .setDescription('Read a random inspiring story from the epics and puranas.'),
  category: 'knowledge',
  execute: async (interaction, context) => {
    try {
      const { reply } = context;

      const dataPath = path.join(process.cwd(), 'data', 'stories.json');
      let dataRaw;
      try {
        dataRaw = await fs.readFile(dataPath, 'utf-8');
      } catch (err) {
        return reply({ content: 'Stories data is currently unavailable.' });
      }

      const stories = JSON.parse(dataRaw);
      if (!stories || stories.length === 0) {
        return reply({ content: 'No stories found in the database.' });
      }

      const story = stories[Math.floor(Math.random() * stories.length)];

      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.PRAY || '🙏'} ${story.title || 'Divine Story'}`)
        .setDescription(story.text || 'No text available.')
        .setColor(COLORS.GOLD || 0xFFD700)
        .addFields(
          { name: 'Moral', value: story.moral || 'Divine wisdom.' },
          { name: 'Source', value: story.source || 'Ancient texts' }
        );

      await reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
