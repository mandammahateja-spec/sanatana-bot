import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction, dmUser } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for banning')
        .setRequired(false)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.BanMembers],
  execute: async (interaction, context) => {
    const { guild, member: moderator, user: modUser } = context;
    
    let targetUser, reason;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
      reason = context.args.slice(1).join(' ') || 'No reason provided';
    }

    if (!targetUser) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Please specify a valid user to ban.`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.BanMembers)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to ban members.`)] });
    }

    if (targetUser.id === modUser.id) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You cannot ban yourself.`)] });
    }

    try {
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      
      if (targetMember) {
        if (!targetMember.bannable) {
          return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} I cannot ban this user. They may have a higher role than me or I lack permissions.`)] });
        }
        
        if (targetMember.roles.highest.position >= moderator.roles.highest.position && guild.ownerId !== modUser.id) {
          return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You cannot ban someone with an equal or higher role.`)] });
        }

        // DM User
        const dmEmbed = new EmbedBuilder()
          .setTitle(`You have been banned from ${guild.name}`)
          .setColor(COLORS.RED)
          .addFields({ name: 'Reason', value: reason });
        await dmUser(targetUser, dmEmbed);
      }

      // Ban
      await guild.members.ban(targetUser.id, { reason });

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: targetUser.id,
        action: 'ban',
        reason,
        moderatorUser: modUser,
        targetUser: targetUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully banned **${targetUser.tag}**.\n**Reason:** ${reason}`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Ban error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while trying to ban the user.`)] });
    }
  }
};
