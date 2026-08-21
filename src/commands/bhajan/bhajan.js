import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { getMusicService } from '../../services/musicService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bhajan')
    .setDescription('Bhajan & devotional music player')
    .addSubcommand(sub => 
      sub.setName('play')
      .setDescription('Play a bhajan')
      .addStringOption(opt => opt.setName('query').setDescription('Song name or YouTube URL').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('queue').setDescription('Show the current music queue'))
    .addSubcommand(sub => sub.setName('skip').setDescription('Skip the currently playing track'))
    .addSubcommand(sub => sub.setName('pause').setDescription('Pause playback'))
    .addSubcommand(sub => sub.setName('resume').setDescription('Resume playback'))
    .addSubcommand(sub => sub.setName('stop').setDescription('Stop the player and disconnect'))
    .addSubcommand(sub => sub.setName('loop').setDescription('Toggle loop mode (off/track/queue)')),
  
  category: 'bhajan',
  
  execute: async (interaction, context) => {
    try {
      await context.defer();
      const sub = context.isSlash ? interaction.options.getSubcommand() : context.subcommand;
      const guildId = context.guild.id;
      const member = context.member;
      const voiceChannel = member.voice.channel;
      const musicService = getMusicService(guildId);

      if (!voiceChannel) {
        return context.editReply({ 
          embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR || '❌'} You need to be in a voice channel to use music commands!`)] 
        });
      }

      switch (sub) {
        case 'play': {
          const query = context.isSlash ? interaction.options.getString('query') : context.args.slice(1).join(' ');
          if (!query) {
            return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Please provide a song name or URL.')] });
          }

          try {
            const track = await musicService.play(query, voiceChannel, context.channel, context.user);
            const np = musicService.getNowPlaying();
            
            const embed = new EmbedBuilder()
              .setColor(COLORS.SAFFRON)
              .setAuthor({ name: 'Added to Queue', iconURL: context.user.displayAvatarURL() })
              .setTitle(track.title)
              .setURL(track.url)
              .setThumbnail(track.thumbnail)
              .addFields(
                { name: 'Duration', value: track.duration, inline: true },
                { name: 'Position', value: np === track ? 'Now Playing' : `${musicService.getQueue().length}`, inline: true }
              );

            return context.editReply({ embeds: [embed] });
          } catch (err) {
            return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`Failed to play: ${err.message}`)] });
          }
        }

        case 'queue': {
          const queue = musicService.getQueue();
          const np = musicService.getNowPlaying();
          
          if (!np && queue.length === 0) {
            return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription('The queue is empty.')] });
          }

          const embed = new EmbedBuilder()
            .setColor(COLORS.SAFFRON)
            .setTitle(`${EMOJIS.MUSIC || '🎵'} Bhajan Queue`)
            .setDescription(`**Now Playing:**\n[${np.title}](${np.url}) | \`${np.duration}\`\n\n**Up Next:**\n` + 
              (queue.length > 0 ? queue.slice(0, 10).map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) | \`${t.duration}\``).join('\n') : 'No more tracks in queue.'));
            
          if (queue.length > 10) {
            embed.setFooter({ text: `...and ${queue.length - 10} more tracks.` });
          }
          
          return context.editReply({ embeds: [embed] });
        }

        case 'skip': {
          if (!musicService.getNowPlaying()) {
            return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Nothing is playing right now.')] });
          }
          musicService.skip();
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`${EMOJIS.NEXT || '⏭️'} Skipped the current track.`)] });
        }

        case 'pause': {
          if (musicService.pause()) {
            return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`${EMOJIS.PAUSE || '⏸️'} Paused playback.`)] });
          }
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Not playing or already paused.')] });
        }

        case 'resume': {
          if (musicService.resume()) {
            return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`${EMOJIS.PLAY || '▶️'} Resumed playback.`)] });
          }
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Not paused or no active player.')] });
        }

        case 'stop': {
          musicService.stop();
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`${EMOJIS.STOP || '⏹️'} Stopped playback and cleared queue.`)] });
        }

        case 'loop': {
          const modes = ['off', 'track', 'queue'];
          const currentIndex = modes.indexOf(musicService.loopMode);
          const nextMode = modes[(currentIndex + 1) % modes.length];
          musicService.setLoop(nextMode);
          
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`Loop mode set to: **${nextMode}**`)] });
        }

        default:
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Invalid subcommand.')] });
      }
    } catch (error) {
      console.error(error);
      await context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('An error occurred while executing the command.')] }).catch(() => {});
    }
  }
};
