import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('mantra')
    .setDescription('Learn a Mantra with its meaning and benefits.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Which mantra to display')
        .setRequired(true)
        .addChoices(
          { name: 'Gayatri Mantra', value: 'gayatri' },
          { name: 'Mahamrityunjaya Mantra', value: 'mahamrityunjaya' },
          { name: 'Ganesh Mantra', value: 'ganesh' },
          { name: 'Shanti Mantra', value: 'shanti' }
        )
    ),
  category: 'knowledge',
  execute: async (interaction, context) => {
    try {
      const { reply, args } = context;
      
      let mantraName = '';
      if (context.isSlash) {
        mantraName = interaction.options.getString('name');
      } else {
        mantraName = args[0] ? args[0].toLowerCase() : 'gayatri';
      }

      const dataPath = path.join(process.cwd(), 'data', 'mantras.json');
      let dataRaw;
      try {
        dataRaw = await fs.readFile(dataPath, 'utf-8');
      } catch (err) {
        return reply({ content: 'Mantras data is currently unavailable.' });
      }

      const mantras = JSON.parse(dataRaw);
      const mantra = mantras[mantraName];

      if (!mantra) {
        return reply({ content: 'Sorry, that Mantra was not found. Try: gayatri, mahamrityunjaya, ganesh, shanti.' });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.OM || '🕉️'} ${mantra.title || 'Mantra'}`)
        .setColor(COLORS.SAFFRON || 0xFF9933)
        .addFields(
          { name: 'Sanskrit', value: mantra.sanskrit || 'Not available' },
          { name: 'Transliteration', value: mantra.transliteration || 'Not available' },
          { name: 'Meaning', value: mantra.meaning || 'Not available' },
          { name: 'Source', value: mantra.source || 'Unknown' },
          { name: 'Benefits', value: mantra.benefits || 'Brings peace and spiritual growth.' }
        )
        .setFooter({ text: 'Chant with devotion and pure intentions.' });

      await reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
