import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { COLORS, EMOJIS } from '../config/constants.js';
import { supabase, isDatabaseAvailable } from '../config/supabase.js';
import { getConfig, setConfig } from '../models/guildConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shlokasPath = path.join(__dirname, '../../data/shlokas.json');

export const postDailyShloka = async (client, guildId, channelId) => {
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    let shlokas = [];
    try {
      const data = await fs.readFile(shlokasPath, 'utf8');
      shlokas = JSON.parse(data);
    } catch (err) {
      console.error('Error reading shlokas.json:', err);
      return;
    }

    if (!shlokas || shlokas.length === 0) return;

    let config = await getConfig(guildId);
    if (!config) config = {};
    let index = config.shloka_index || 0;

    if (index >= shlokas.length) {
      index = 0;
    }

    const shloka = shlokas[index];

    const embed = {
      color: COLORS.SAFFRON,
      title: `${EMOJIS.OM || '🕉️'} Daily Shloka`,
      fields: [
        { name: 'Source', value: shloka.source || 'Bhagavad Gita' },
        { name: 'Sanskrit', value: `\`\`\`\n${shloka.sanskrit}\n\`\`\`` },
        { name: 'Transliteration', value: `*${shloka.transliteration}*` },
        { name: 'Meaning', value: shloka.meaning }
      ],
      footer: { text: `Day ${index + 1} of ${shlokas.length} shlokas` },
      timestamp: new Date().toISOString()
    };

    await channel.send({ embeds: [embed] });

    // Update index for tomorrow
    const nextIndex = (index + 1) % shlokas.length;
    await setConfig(guildId, { shloka_index: nextIndex });

  } catch (error) {
    console.error(`Error posting daily shloka for guild ${guildId}:`, error);
  }
};
