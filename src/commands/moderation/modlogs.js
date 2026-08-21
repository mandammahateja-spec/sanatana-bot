import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { getLogs } from '../../models/modLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('modlogs')
    .setDescription('View recent moderation logs for this server'),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ViewAuditLog],
  execute: async (interaction, context) => {
    const { guild, member: moderator } = context;

    if (!moderator.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to view mod logs.`)] });
    }

    try {
      const logs = await getLogs(guild.id, 10, 0);

      const embed = new EmbedBuilder()
        .setTitle(`Recent Mod Logs - ${guild.name}`)
        .setColor(COLORS.SAFFRON);

      if (logs.length === 0) {
        embed.setDescription(`${EMOJIS.INFO} No moderation logs found.`);
      } else {
        logs.forEach(log => {
          const date = new Date(log.created_at).toLocaleString();
          let details = `**Target:** <@${log.target_id}>\n**Mod:** <@${log.moderator_id}>\n**Reason:** ${log.reason || 'None'}`;
          if (log.duration) details += `\n**Duration:** ${log.duration}`;
          embed.addFields({ name: `${log.action.toUpperCase()} - ${date}`, value: details });
        });
      }
        
      await context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Modlogs error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while fetching mod logs.`)] });
    }
  }
};
