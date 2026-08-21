import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction, dmUser } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a timeout from a member')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to untimeout')
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ModerateMembers],
  execute: async (interaction, context) => {
    const { guild, member: moderator, user: modUser } = context;
    
    let targetUser;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
    }

    if (!targetUser) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /untimeout <user>`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to untimeout members.`)] });
    }

    try {
      const targetMember = await guild.members.fetch(targetUser.id);
      
      if (!targetMember.isCommunicationDisabled()) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} This user is not timed out.`)] });
      }

      if (!targetMember.moderatable) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} I cannot untimeout this user. They may have a higher role than me.`)] });
      }

      // Untimeout
      await targetMember.timeout(null, 'Timeout removed via command');

      // DM User
      const dmEmbed = new EmbedBuilder()
        .setTitle(`Your timeout has been removed in ${guild.name}`)
        .setColor(COLORS.GREEN)
        .setDescription('You can now chat again.');
      await dmUser(targetUser, dmEmbed);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: targetUser.id,
        action: 'untimeout',
        reason: 'Timeout removed',
        moderatorUser: modUser,
        targetUser: targetUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully removed timeout from **${targetUser.tag}**.`);
        
      await context.reply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Untimeout error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while trying to untimeout the user.`)] });
    }
  }
};
