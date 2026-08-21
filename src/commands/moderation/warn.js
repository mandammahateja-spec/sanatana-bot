import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction, dmUser } from '../../services/modLogService.js';
import { addWarning, getWarningCount } from '../../models/modLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for warning')
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ModerateMembers],
  execute: async (interaction, context) => {
    const { guild, member: moderator, user: modUser } = context;
    
    let targetUser, reason;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
      reason = interaction.options.getString('reason');
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
      reason = context.args.slice(1).join(' ');
    }

    if (!targetUser || !reason) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /warn <user> <reason>`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to warn members.`)] });
    }

    if (targetUser.id === modUser.id) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You cannot warn yourself.`)] });
    }

    try {
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (targetMember && targetMember.roles.highest.position >= moderator.roles.highest.position && guild.ownerId !== modUser.id) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You cannot warn someone with an equal or higher role.`)] });
      }

      // Add to DB
      await addWarning({
        guildId: guild.id,
        userId: targetUser.id,
        moderatorId: modUser.id,
        reason
      });

      const count = await getWarningCount(guild.id, targetUser.id);

      // DM User
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You received a warning in ${guild.name}`)
        .setColor(COLORS.MAROON)
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Total Warnings', value: `${count}` }
        );
      await dmUser(targetUser, dmEmbed);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: targetUser.id,
        action: 'warn',
        reason,
        moderatorUser: modUser,
        targetUser: targetUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully warned **${targetUser.tag}**.\n**Reason:** ${reason}\nThey now have **${count}** warning(s).`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Warn error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while trying to warn the user.`)] });
    }
  }
};
