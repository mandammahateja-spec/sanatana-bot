import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { getMusicService } from '../../services/musicService.js';

const AARTI_MAP = {
  'ganga': 'Ganga Aarti Haridwar',
  'jagdish': 'Om Jai Jagdish Hare Aarti',
  'shiv': 'Om Jai Shiv Omkara Aarti',
  'lakshmi': 'Om Jai Lakshmi Mata Aarti',
  'ambe': 'Jai Ambe Gauri Aarti',
  'hanuman': 'Aarti Keeje Hanuman Lala Ki',
  'ganesh': 'Jai Ganesh Jai Ganesh Deva Aarti',
  'saraswati': 'Saraswati Aarti',
  'vishnu': 'Om Jai Jagdish Hare Vishnu Aarti',
  'krishna': 'Shri Krishna Aarti'
};

export default {
  data: new SlashCommandBuilder()
    .setName('aarti')
    .setDescription('Play a specific divine Aarti')
    .addStringOption(option => 
      option.setName('deity')
        .setDescription('Select the Aarti to play')
        .setRequired(true)
        .addChoices(
          ...Object.keys(AARTI_MAP).map(key => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: key }))
        )
    ),
  
  category: 'bhajan',
  
  execute: async (interaction, context) => {
    try {
      await context.defer();
      const deityKey = context.isSlash ? interaction.options.getString('deity') : context.args[0]?.toLowerCase();
      
      if (!deityKey || !AARTI_MAP[deityKey]) {
        return context.editReply({ 
          embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Please specify a valid Aarti from the list.')] 
        });
      }

      const query = AARTI_MAP[deityKey];
      const guild = context.guild;
      const member = await guild.members.fetch(context.user.id).catch(() => context.member);
      const voiceChannel = member?.voice?.channel;
      
      if (!voiceChannel) {
        return context.editReply({ 
          embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR || '❌'} You need to join a voice channel first before using this command!`)] 
        });
      }

      const musicService = getMusicService(context.guild.id);
      
      try {
        const track = await musicService.play(query, voiceChannel, context.channel, context.user);
        
        const embed = new EmbedBuilder()
          .setColor(COLORS.GOLD)
          .setAuthor({ name: 'Divine Aarti Added', iconURL: context.user.displayAvatarURL() })
          .setTitle(track.title)
          .setURL(track.url)
          .setThumbnail(track.thumbnail)
          .addFields(
            { name: 'Duration', value: track.duration, inline: true }
          )
          .setFooter({ text: `${EMOJIS.PRAY || '🙏'} Jai ${deityKey.charAt(0).toUpperCase() + deityKey.slice(1)}` });

        return context.editReply({ embeds: [embed] });
      } catch (err) {
        return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`Failed to play Aarti: ${err.message}`)] });
      }
    } catch (error) {
      console.error(error);
      await context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('An error occurred while playing Aarti.')] }).catch(() => {});
    }
  }
};
