import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current channel'),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ManageChannels],
  execute: async (interaction, context) => {
    const { channel, guild, member: moderator, user: modUser } = context;

    if (!moderator.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to manage channels.`)] });
    }

    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: false
      });

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: channel.id,
        action: 'lock',
        reason: `Locked #${channel.name}`,
        moderatorUser: modUser,
        targetUser: { id: channel.id, tag: `#${channel.name}` }
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.MAROON)
        .setTitle(`${EMOJIS.TRIDENT} Channel Locked`)
        .setDescription(`This channel has been locked by a moderator. You can no longer send messages here until it is unlocked.`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Lock error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while trying to lock the channel.`)] });
    }
  }
};
