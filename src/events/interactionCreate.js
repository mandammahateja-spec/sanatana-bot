import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../config/constants.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      // Permission check
      if (command.permissions && command.permissions.length > 0) {
        const missingPerms = command.permissions.filter(perm => !interaction.member.permissions.has(perm));
        if (missingPerms.length > 0) {
          const embed = new EmbedBuilder()
            .setColor(COLORS.RED || 0xFF0000)
            .setDescription(`${EMOJIS.TRIDENT || '🔱'} You do not have permission to use this command.`);
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }

      const context = {
        isSlash: true,
        guild: interaction.guild,
        channel: interaction.channel,
        user: interaction.user,
        member: interaction.member,
        client: interaction.client,
        reply: async (options) => {
          if (interaction.replied || interaction.deferred) {
            return await interaction.followUp(options);
          }
          return await interaction.reply(options);
        },
        followUp: async (options) => await interaction.followUp(options),
        defer: async (options) => await interaction.deferReply(options),
        editReply: async (options) => await interaction.editReply(options),
      };

      try {
        await command.execute(interaction, context);
      } catch (error) {
        console.error(`Error executing slash command ${interaction.commandName}:`, error);
        const errorEmbed = new EmbedBuilder()
          .setColor(COLORS.RED || 0xFF0000)
          .setTitle('Error')
          .setDescription('There was an error while executing this command!');
        
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
          } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }
        } catch (e) {
          console.error('Error sending error reply:', e);
        }
      }
    } else if (interaction.isButton()) {
       // Extend later for buttonHandler
       console.log(`Button clicked: ${interaction.customId}`);
    } else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (command.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (error) {
          console.error(`Error autocompleting ${interaction.commandName}:`, error);
        }
      }
    }
  }
};
