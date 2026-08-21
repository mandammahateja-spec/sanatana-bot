import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete messages in the current channel')
    .addIntegerOption(option => 
      option.setName('count')
        .setDescription('Number of messages to delete (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ManageMessages],
  execute: async (interaction, context) => {
    const { channel, guild, member: moderator, user: modUser } = context;
    
    let count;
    
    if (context.isSlash) {
      count = interaction.options.getInteger('count');
    } else {
      count = parseInt(context.args[0]);
    }

    if (!count || isNaN(count) || count < 1 || count > 100) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Please provide a valid number between 1 and 100.`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to manage messages.`)] });
    }

    try {
      if (context.isSlash) {
        await context.defer(); // Defer to avoid interaction timeout
      }

      // Add 1 to count for prefix command to delete the command message itself
      const fetchCount = context.isSlash ? count : Math.min(100, count + 1);
      const deleted = await channel.bulkDelete(fetchCount, true);
      
      const actualDeleted = context.isSlash ? deleted.size : Math.max(0, deleted.size - 1);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: channel.id,
        action: 'clear',
        reason: `Cleared ${actualDeleted} messages in #${channel.name}`,
        moderatorUser: modUser,
        targetUser: { id: channel.id, tag: `#${channel.name}` }
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully deleted **${actualDeleted}** messages.`);
        
      if (context.isSlash) {
        await context.editReply({ embeds: [confirmEmbed] });
      } else {
        const msg = await channel.send({ embeds: [confirmEmbed] });
        setTimeout(() => msg.delete().catch(() => {}), 5000); // delete confirmation after 5s
      }

    } catch (error) {
      console.error('Clear error:', error);
      const errEmbed = new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred. Note that messages older than 14 days cannot be bulk deleted.`);
      if (context.isSlash) {
        return context.editReply({ embeds: [errEmbed] });
      } else {
        return channel.send({ embeds: [errEmbed] });
      }
    }
  }
};
