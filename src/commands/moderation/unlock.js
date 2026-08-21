import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel'),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ManageChannels],
  execute: async (interaction, context) => {
    const { channel, guild, member: moderator, user: modUser } = context;

    if (!moderator.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to manage channels.`)] });
    }

    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: null
      });

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: channel.id,
        action: 'unlock',
        reason: `Unlocked #${channel.name}`,
        moderatorUser: modUser,
        targetUser: { id: channel.id, tag: `#${channel.name}` }
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setTitle(`${EMOJIS.SUCCESS} Channel Unlocked`)
        .setDescription(`This channel has been unlocked. You may now send messages.`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Unlock error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while trying to unlock the channel.`)] });
    }
  }
};
