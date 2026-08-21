import { SlashCommandBuilder } from 'discord.js';
import { getPanchang } from '../../services/panchangService.js';
import { getConfig } from '../../models/guildConfig.js';
import { COLORS, EMOJIS, DEFAULT_TIMEZONE } from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('panchang')
    .setDescription('Display today\'s Hindu calendar (Panchang) information.'),
  category: 'daily',
  execute: async (interaction, context) => {
    try {
      await context.defer();
      
      let timezone = DEFAULT_TIMEZONE;
      if (context.guild) {
        const config = await getConfig(context.guild.id);
        if (config && config.timezone) {
          timezone = config.timezone;
        }
      }

      const today = new Date();
      const panchang = getPanchang(today, timezone);

      const embed = {
        color: panchang.auspicious ? COLORS.GREEN : COLORS.SAFFRON,
        title: `${EMOJIS.CALENDAR || '📅'} Today's Panchang (${panchang.date})`,
        description: `Hindu calendar details for **${panchang.day}** (Timezone: ${timezone})`,
        fields: [
          { name: 'Tithi (Lunar Day)', value: `${panchang.tithi} (${panchang.paksha})`, inline: true },
          { name: 'Associated Deity', value: panchang.deity, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: 'Approx. Sunrise', value: panchang.sunrise, inline: true },
          { name: 'Approx. Sunset', value: panchang.sunset, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: 'Rahu Kaal (Inauspicious)', value: panchang.rahuKaal, inline: false },
          { name: 'General Auspiciousness', value: panchang.auspicious ? "Generally favorable day" : "Average/Mixed day", inline: false }
        ],
        footer: { text: panchang.note },
        timestamp: today.toISOString()
      };

      await context.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error executing panchang command:', error);
      await context.editReply({ content: 'An error occurred while calculating the panchang.' });
    }
  }
};
