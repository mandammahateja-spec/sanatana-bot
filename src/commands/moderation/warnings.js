import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { getWarnings } from '../../models/modLog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View a user\'s warning history')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check')
        .setRequired(true)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ModerateMembers],
  execute: async (interaction, context) => {
    const { guild, member: moderator } = context;
    
    let targetUser;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
    }

    if (!targetUser) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /warnings <user>`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to view warnings.`)] });
    }

    try {
      const warnings = await getWarnings(guild.id, targetUser.id);

      const embed = new EmbedBuilder()
        .setTitle(`Warnings for ${targetUser.tag}`)
        .setColor(COLORS.SAFFRON)
        .setThumbnail(targetUser.displayAvatarURL());

      if (warnings.length === 0) {
        embed.setDescription(`${EMOJIS.SUCCESS} This user has no warnings.`);
      } else {
        embed.setDescription(`Total Warnings: **${warnings.length}**\n\n`);
        const recentWarnings = warnings.slice(0, 10);
        
        recentWarnings.forEach((warn, index) => {
          const date = new Date(warn.created_at).toLocaleDateString();
          embed.addFields({ 
            name: `${index + 1}. [${date}] by <@${warn.moderator_id}>`, 
            value: warn.reason 
          });
        });
        
        if (warnings.length > 10) {
          embed.setFooter({ text: `Showing latest 10 of ${warnings.length} warnings` });
        }
      }
        
      await context.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Warnings error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while fetching warnings.`)] });
    }
  }
};
