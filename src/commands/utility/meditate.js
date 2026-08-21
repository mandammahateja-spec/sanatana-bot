import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';

const activeSessions = new Set();

export default {
  data: new SlashCommandBuilder()
    .setName('meditate')
    .setDescription('Start a meditation timer.')
    .addIntegerOption(option =>
      option.setName('minutes')
        .setDescription('Duration in minutes (1-60)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(60)
    ),
  category: 'utility',
  execute: async (interaction, context) => {
    try {
      const { user, reply, followUp, args, isSlash } = context;

      let minutes = 10;
      if (isSlash) {
        minutes = interaction.options.getInteger('minutes');
      } else {
        minutes = parseInt(args[0]);
        if (isNaN(minutes) || minutes < 1 || minutes > 60) {
          return reply({ content: 'Please provide a valid duration in minutes (1-60).' });
        }
      }

      if (activeSessions.has(user.id)) {
        return reply({ content: 'You already have an active meditation session!' });
      }

      activeSessions.add(user.id);

      const startEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.BELL || '🔔'} Meditation Timer`)
        .setDescription(`Meditation session started — **${minutes}** minutes.\nClose your eyes and focus on your breath.`)
        .setColor(COLORS.SAFFRON || 0xFF9933);

      await reply({ embeds: [startEmbed] });

      setTimeout(async () => {
        activeSessions.delete(user.id);
        const endEmbed = new EmbedBuilder()
          .setTitle(`${EMOJIS.BELL || '🔔'} Meditation Session Ended`)
          .setDescription(`<@${user.id}>, your meditation session has ended. Om Shanti.`)
          .setColor(COLORS.GREEN || 0x228B22);
          
        await followUp({ embeds: [endEmbed], content: `<@${user.id}>` });
      }, minutes * 60 * 1000);

    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
