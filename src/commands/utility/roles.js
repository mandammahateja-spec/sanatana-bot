import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { setConfig } from '../../models/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('Set up reaction roles for the community.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  category: 'admin',
  permissions: [PermissionFlagsBits.ManageRoles],
  execute: async (interaction, context) => {
    try {
      const { reply, guild, member } = context;

      if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return reply({ content: 'You do not have permission to run this command.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('Choose Your Spiritual Path')
        .setDescription('React to this message to receive your role:\n\n📿 **Bhakti Yoga** — Path of Devotion\n📖 **Gyaan Yoga** — Path of Knowledge\n⚡ **Karma Yoga** — Path of Selfless Action')
        .setColor(COLORS.SAFFRON || 0xFF9933)
        .setFooter({ text: 'Reaction Roles Setup' });

      const message = await reply({ embeds: [embed], fetchReply: true });
      
      const realMessage = context.isSlash ? await interaction.fetchReply() : message;

      try {
        await realMessage.react('📿');
        await realMessage.react('📖');
        await realMessage.react('⚡');
      } catch (err) {
        console.error('Failed to add reactions:', err);
      }

      try {
        await setConfig(guild.id, { reactionRoleMessageId: realMessage.id });
      } catch (err) {
        console.error('Failed to save reactionRoleMessageId to config:', err);
      }

    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
