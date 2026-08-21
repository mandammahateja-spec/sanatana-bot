import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for the current channel')
    .addIntegerOption(option => 
      option.setName('seconds')
        .setDescription('Delay in seconds (0-21600)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ManageChannels],
  execute: async (interaction, context) => {
    const { channel, member: moderator } = context;
    
    let seconds;
    
    if (context.isSlash) {
      seconds = interaction.options.getInteger('seconds');
    } else {
      seconds = parseInt(context.args[0]);
    }

    if (seconds === undefined || isNaN(seconds) || seconds < 0 || seconds > 21600) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Please provide a valid number of seconds between 0 and 21600.`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to manage channels.`)] });
    }

    try {
      await channel.setRateLimitPerUser(seconds);

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Slowmode is now set to **${seconds}** seconds.`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Slowmode error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while setting slowmode.`)] });
    }
  }
};
