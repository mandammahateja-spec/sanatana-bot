import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { COLORS, EMOJIS } from '../../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const festivalsPath = path.join(__dirname, '../../../data/festivals.json');

export const checkFestivalReminders = async (client, guildId, channelId) => {
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    let festivals = [];
    try {
      const data = await fs.readFile(festivalsPath, 'utf8');
      festivals = JSON.parse(data);
    } catch (err) {
      console.error('Error reading festivals.json:', err);
      return;
    }

    if (!festivals || festivals.length === 0) return;

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const month = tomorrow.getMonth() + 1; // 1-12
    const day = tomorrow.getDate();
    const dateString = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`; // MM-DD

    const upcomingFestivals = festivals.filter(f => f.date === dateString);

    for (const festival of upcomingFestivals) {
      const embed = {
        color: COLORS.GOLD,
        title: `${festival.emoji || '🎉'} Festival Tomorrow: ${festival.name}!`,
        description: festival.description || `Prepare for the auspicious occasion of ${festival.name}.`,
        fields: [],
        timestamp: new Date().toISOString()
      };

      if (festival.deity) {
        embed.fields.push({ name: 'Associated Deity', value: festival.deity, inline: true });
      }
      if (festival.observance) {
        embed.fields.push({ name: 'Observance', value: festival.observance, inline: true });
      }

      await channel.send({ content: '@everyone', embeds: [embed] });
    }

  } catch (error) {
    console.error(`Error checking festival reminders for guild ${guildId}:`, error);
  }
};
