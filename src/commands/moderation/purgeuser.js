import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purgeuser')
    .setDescription('Delete specific user\'s recent messages in this channel')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user whose messages to delete')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('count')
        .setDescription('Number of messages to scan (max 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ManageMessages],
  execute: async (interaction, context) => {
    const { channel, guild, member: moderator, user: modUser } = context;
    
    let targetUser, count;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
      count = interaction.options.getInteger('count');
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
      count = parseInt(context.args[1]);
    }

    if (!targetUser || !count || isNaN(count) || count < 1 || count > 100) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /purgeuser <user> <count (1-100)>`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to manage messages.`)] });
    }

    try {
      if (context.isSlash) await context.defer();
      
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(m => m.author.id === targetUser.id).first(count);
      
      if (userMessages.length === 0) {
        const noMsgEmbed = new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`No recent messages found from **${targetUser.tag}**.`);
        return context.isSlash ? context.editReply({ embeds: [noMsgEmbed] }) : context.reply({ embeds: [noMsgEmbed] });
      }

      await channel.bulkDelete(userMessages, true);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: targetUser.id,
        action: 'purgeuser',
        reason: `Purged ${userMessages.length} messages in #${channel.name}`,
        moderatorUser: modUser,
        targetUser: targetUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully deleted **${userMessages.length}** messages from **${targetUser.tag}**.`);
        
      if (context.isSlash) {
        await context.editReply({ embeds: [confirmEmbed] });
      } else {
        const msg = await channel.send({ embeds: [confirmEmbed] });
        setTimeout(() => msg.delete().catch(() => {}), 5000);
      }

    } catch (error) {
      console.error('Purgeuser error:', error);
      const errEmbed = new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred. Messages older than 14 days cannot be bulk deleted.`);
      return context.isSlash ? context.editReply({ embeds: [errEmbed] }) : context.reply({ embeds: [errEmbed] });
    }
  }
};
