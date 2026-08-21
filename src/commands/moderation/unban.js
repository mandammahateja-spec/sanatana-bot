import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by ID')
    .addStringOption(option => 
      option.setName('userid')
        .setDescription('The ID of the user to unban')
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.BanMembers],
  execute: async (interaction, context) => {
    const { guild, member: moderator, user: modUser } = context;
    
    let userId;
    
    if (context.isSlash) {
      userId = interaction.options.getString('userid');
    } else {
      userId = context.args[0];
    }

    if (!userId || !/^\d{17,19}$/.test(userId)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Please provide a valid user ID to unban.`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.BanMembers)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to unban members.`)] });
    }

    try {
      const unbannedUser = await guild.members.unban(userId);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: unbannedUser.id,
        action: 'unban',
        reason: 'Unbanned via command',
        moderatorUser: modUser,
        targetUser: unbannedUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully unbanned **${unbannedUser.tag}**.`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Unban error:', error);
      if (error.code === 10026) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} That user is not banned.`)] });
      }
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while trying to unban the user. Make sure the ID is correct.`)] });
    }
  }
};
