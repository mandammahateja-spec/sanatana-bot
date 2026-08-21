import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { getConfig, setConfig } from '../../models/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('toggle')
    .setDescription('Enable or disable bot features')
    .addStringOption(option => 
      option.setName('feature')
        .setDescription('The feature to toggle')
        .setRequired(true)
        .addChoices(
          { name: 'Music', value: 'music' },
          { name: 'Quiz', value: 'quiz' },
          { name: 'Daily Content', value: 'daily' },
          { name: 'Auto Reply', value: 'autoReply' }
        ))
    .addStringOption(option => 
      option.setName('state')
        .setDescription('On or Off')
        .setRequired(true)
        .addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })),
  category: 'admin',
  permissions: [PermissionFlagsBits.ManageGuild],
  execute: async (interaction, context) => {
    const { guild, member: moderator } = context;

    if (!moderator.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You need Manage Server permission to use this command.`)] });
    }

    let feature, state;

    if (context.isSlash) {
      feature = interaction.options.getString('feature');
      state = interaction.options.getString('state');
    } else {
      feature = context.args[0];
      state = context.args[1];
      if (!feature || !state || !['music', 'quiz', 'daily', 'autoReply'].includes(feature) || !['on', 'off'].includes(state)) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /toggle <music|quiz|daily|autoReply> <on|off>`)] });
      }
    }

    try {
      const isEnabled = state === 'on';
      const success = await setConfig(guild.id, 'features', { [feature]: isEnabled });

      if (success) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.GREEN)
          .setDescription(`${EMOJIS.SUCCESS} Feature **${feature}** has been **${isEnabled ? 'Enabled' : 'Disabled'}**.`);
        await context.reply({ embeds: [embed] });
      } else {
        await context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Failed to update feature toggle.`)] });
      }

    } catch (error) {
      console.error('Toggle error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while updating the feature toggle.`)] });
    }
  }
};
