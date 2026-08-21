import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('temple-timing')
    .setDescription('Look up temple timings by city.')
    .addStringOption(option =>
      option.setName('city')
        .setDescription('City to search in')
        .setRequired(true)
    ),
  category: 'utility',
  execute: async (interaction, context) => {
    try {
      const { reply, args, isSlash } = context;

      let cityQuery = '';
      if (isSlash) {
        cityQuery = interaction.options.getString('city');
      } else {
        cityQuery = args.join(' ');
        if (!cityQuery) {
          return reply({ content: 'Please provide a city name.' });
        }
      }

      const dataPath = path.join(process.cwd(), 'data', 'temples.json');
      let dataRaw;
      try {
        dataRaw = await fs.readFile(dataPath, 'utf-8');
      } catch (err) {
        return reply({ content: 'Temple data is currently unavailable.' });
      }

      const temples = JSON.parse(dataRaw);
      
      const matchedTemples = temples.filter(t => t.city.toLowerCase().includes(cityQuery.toLowerCase()));

      if (matchedTemples.length === 0) {
        const availableCities = [...new Set(temples.map(t => t.city))].join(', ');
        return reply({ content: `No temples found in "${cityQuery}". Available cities: ${availableCities}` });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.TRIDENT || '🔱'} Temples in ${cityQuery}`)
        .setColor(COLORS.SAFFRON || 0xFF9933);

      matchedTemples.forEach(t => {
        embed.addFields({
          name: t.name,
          value: `**Darshan:** ${t.darshan}\n**Aarti:** ${t.aarti}`
        });
      });

      await reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
