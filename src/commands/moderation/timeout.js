import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction, dmUser } from '../../services/modLogService.js';

function parseDuration(durationStr) {
  const regex = /^(\d+)([smhd])$/;
  const match = durationStr.toLowerCase().match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  let multiplier = 1;
  if (unit === 's') multiplier = 1000;
  if (unit === 'm') multiplier = 1000 * 60;
  if (unit === 'h') multiplier = 1000 * 60 * 60;
  if (unit === 'd') multiplier = 1000 * 60 * 60 * 24;

  return value * multiplier;
}

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('duration')
        .setDescription('Duration (e.g., 10m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for timeout')
        .setRequired(false)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ModerateMembers],
  execute: async (interaction, context) => {
    const { guild, member: moderator, user: modUser } = context;
    
    let targetUser, durationStr, reason;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
      durationStr = interaction.options.getString('duration');
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
      durationStr = context.args[1];
      reason = context.args.slice(2).join(' ') || 'No reason provided';
    }

    if (!targetUser || !durationStr) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /timeout <user> <duration> [reason]`)] });
    }

    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs < 10000 || durationMs > 2419200000) { // Max 28 days
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Invalid duration. Format: \`10m\`, \`1h\`, \`1d\`. Min: 10s, Max: 28d.`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to timeout members.`)] });
    }

    try {
      const targetMember = await guild.members.fetch(targetUser.id);
      
      if (!targetMember.moderatable) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} I cannot timeout this user. They may have a higher role than me.`)] });
      }

      // DM User
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You have been timed out in ${guild.name}`)
        .setColor(COLORS.MAROON)
        .addFields(
          { name: 'Duration', value: durationStr },
          { name: 'Reason', value: reason }
        );
      await dmUser(targetUser, dmEmbed);

      // Timeout
      await targetMember.timeout(durationMs, reason);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: targetUser.id,
        action: 'timeout',
        reason,
        duration: durationStr,
        moderatorUser: modUser,
        targetUser: targetUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully timed out **${targetUser.tag}** for ${durationStr}.\n**Reason:** ${reason}`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Timeout error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while trying to timeout the user.`)] });
    }
  }
};
