import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('chalisa')
    .setDescription('Read a Chalisa verse by verse.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Which Chalisa to read')
        .setRequired(true)
        .addChoices(
          { name: 'Hanuman Chalisa', value: 'hanuman' },
          { name: 'Shiv Chalisa', value: 'shiv' },
          { name: 'Durga Chalisa', value: 'durga' },
          { name: 'Ganesh Chalisa', value: 'ganesh' }
        )
    ),
  category: 'knowledge',
  execute: async (interaction, context) => {
    try {
      const { user, reply, args } = context;
      
      let chalisaName = '';
      if (context.isSlash) {
        chalisaName = interaction.options.getString('name');
      } else {
        chalisaName = args[0] ? args[0].toLowerCase() : 'hanuman';
      }
      
      const validChalisas = ['hanuman', 'shiv', 'durga', 'ganesh'];
      if (!validChalisas.includes(chalisaName)) {
        return reply({ content: 'Invalid chalisa name. Please choose from: hanuman, shiv, durga, ganesh.' });
      }

      const dataPath = path.join(process.cwd(), 'data', 'chalisas.json');
      let dataRaw;
      try {
        dataRaw = await fs.readFile(dataPath, 'utf-8');
      } catch (err) {
        return reply({ content: 'Chalisas data is currently unavailable.' });
      }

      const chalisas = JSON.parse(dataRaw);
      const chalisa = chalisas[chalisaName];

      if (!chalisa) {
        return reply({ content: 'Sorry, that Chalisa was not found in the database.' });
      }

      const verses = chalisa.verses || [];
      const title = chalisa.title || `${chalisaName} Chalisa`;
      
      const versesPerPage = 10;
      const pages = Math.ceil(verses.length / versesPerPage);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * versesPerPage;
        const currentVerses = verses.slice(start, start + versesPerPage);
        
        let description = currentVerses.map(v => `${v.text}\n*${v.meaning}*`).join('\n\n');
        if (!description) description = "No content on this page.";

        return new EmbedBuilder()
          .setTitle(`${EMOJIS.PRAY || '🙏'} ${title} (Page ${page + 1}/${pages})`)
          .setDescription(description)
          .setColor(COLORS.SAFFRON || 0xFF9933)
          .setFooter({ text: 'May the divine bless you.' });
      };

      const getRow = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`prev_${user.id}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId(`next_${user.id}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === pages - 1)
        );
      };

      const message = await reply({ embeds: [generateEmbed(0)], components: pages > 1 ? [getRow(0)] : [] });

      if (pages <= 1) return;

      const channel = context.isSlash ? interaction.channel : message.channel;
      const collector = channel.createMessageComponentCollector({
        filter: i => ['prev_' + user.id, 'next_' + user.id].includes(i.customId),
        time: 120000
      });

      collector.on('collect', async i => {
        if (i.customId.startsWith('prev')) {
          currentPage--;
        } else if (i.customId.startsWith('next')) {
          currentPage++;
        }
        await i.update({ embeds: [generateEmbed(currentPage)], components: [getRow(currentPage)] });
      });

      collector.on('end', () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('prev_disabled').setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('next_disabled').setLabel('Next').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );
        if (context.isSlash) {
          interaction.editReply({ components: [disabledRow] }).catch(() => {});
        } else {
          message.edit({ components: [disabledRow] }).catch(() => {});
        }
      });

    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
