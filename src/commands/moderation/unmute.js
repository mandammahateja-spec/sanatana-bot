import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction, dmUser } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a member by removing the Muted role')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ManageRoles],
  execute: async (interaction, context) => {
    const { guild, member: moderator, user: modUser } = context;
    
    let targetUser;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
    }

    if (!targetUser) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /unmute <user>`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to manage roles.`)] });
    }

    try {
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} User not found in this server.`)] });

      const muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      if (!muteRole || !targetMember.roles.cache.has(muteRole.id)) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`${EMOJIS.WARNING} User is not muted.`)] });
      }

      await targetMember.roles.remove(muteRole, 'Unmuted via command');

      // DM User
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You have been unmuted in ${guild.name}`)
        .setColor(COLORS.GREEN)
        .setDescription('You can now chat again.');
      await dmUser(targetUser, dmEmbed);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: targetUser.id,
        action: 'unmute',
        reason: 'Unmuted via command',
        moderatorUser: modUser,
        targetUser: targetUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully unmuted **${targetUser.tag}**.`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Unmute error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while unmuting the user.`)] });
    }
  }
};
