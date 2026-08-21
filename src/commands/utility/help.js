import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show bot commands and information')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('Specific command to get help for')
        .setRequired(false)),
  category: 'utility',
  execute: async (interaction, context) => {
    const { client } = context;
    
    let commandName;
    if (context.isSlash) {
      commandName = interaction.options.getString('command');
    } else {
      commandName = context.args[0];
    }

    const commands = client.commands;

    // Detailed Help for a specific command
    if (commandName) {
      const command = commands.get(commandName.toLowerCase());
      if (!command) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Command not found: \`${commandName}\``)] });
      }

      const embed = new EmbedBuilder()
        .setColor(COLORS.SAFFRON)
        .setTitle(`Command: /${command.data.name}`)
        .setDescription(command.data.description)
        .addFields({ name: 'Category', value: command.category || 'general' });
      
      // Could add more info here like options
      return context.reply({ embeds: [embed] });
    }

    // Categorized Help Pages
    const categories = [
      { id: 'bhajan', name: 'Bhajan & Music', icon: EMOJIS.MUSIC || '🎵' },
      { id: 'daily', name: 'Daily Spiritual Content', icon: EMOJIS.SUN || '🌅' },
      { id: 'knowledge', name: 'Knowledge & Engagement', icon: EMOJIS.OM || '🕉️' },
      { id: 'utility', name: 'Community & Utility', icon: EMOJIS.BELL || '🔔' },
      { id: 'moderation', name: 'Moderation', icon: EMOJIS.TRIDENT || '🔱' },
      { id: 'admin', name: 'Admin Config', icon: '⚙️' }
    ];

    const pages = categories.map(cat => {
      const catCmds = commands.filter(c => c.category === cat.id);
      
      const embed = new EmbedBuilder()
        .setColor(COLORS.GOLD)
        .setTitle(`${cat.icon} ${cat.name} Commands`)
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({ text: `Page ${categories.indexOf(cat) + 1}/${categories.length}` });

      if (catCmds.size === 0) {
        embed.setDescription('No commands in this category yet.');
      } else {
        const cmdList = catCmds.map(c => `**/${c.data.name}** — ${c.data.description}`).join('\n');
        embed.setDescription(cmdList);
      }

      return embed;
    });

    let currentPage = 0;

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pages.length <= 1)
      );

    const message = await context.reply({ embeds: [pages[currentPage]], components: [row] });

    // Prefix commands might return a plain message, slash returns interaction response
    // For collector, we need the actual message object
    const msgObj = context.isSlash ? await interaction.fetchReply() : message;

    const collector = msgObj.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

    collector.on('collect', async i => {
      if (i.user.id !== context.user.id) {
        return i.reply({ content: 'These buttons aren\'t for you!', ephemeral: true });
      }

      if (i.customId === 'prev') {
        currentPage--;
      } else if (i.customId === 'next') {
        currentPage++;
      }

      row.components[0].setDisabled(currentPage === 0);
      row.components[1].setDisabled(currentPage === pages.length - 1);

      await i.update({ embeds: [pages[currentPage]], components: [row] });
    });

    collector.on('end', () => {
      row.components.forEach(c => c.setDisabled(true));
      msgObj.edit({ components: [row] }).catch(() => {});
    });
  }
};
