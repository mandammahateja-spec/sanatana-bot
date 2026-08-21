import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { getMusicService } from '../../services/musicService.js';
import { getConfig, setConfig } from '../../models/guildConfig.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('lounge')
    .setDescription('Toggle 24/7 Bhajan Lounge playback in a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addBooleanOption(option => 
      option.setName('enable').setDescription('Enable or disable the lounge').setRequired(true)
    )
    .addChannelOption(option => 
      option.setName('channel').setDescription('Voice channel for the lounge').addChannelTypes(ChannelType.GuildVoice)
    ),
    
  category: 'admin',
  permissions: [PermissionFlagsBits.ManageGuild],
  
  execute: async (interaction, context) => {
    try {
      await context.defer();
      
      const enable = context.isSlash ? interaction.options.getBoolean('enable') : context.args[0]?.toLowerCase() === 'true';
      const channelOpt = context.isSlash ? interaction.options.getChannel('channel') : null; // Prefix channel parsing omitted for simplicity
      
      const config = await getConfig(context.guild.id);
      const musicService = getMusicService(context.guild.id);
      
      if (!enable) {
        if (config.loungeEnabled) {
          await setConfig(context.guild.id, { loungeEnabled: false, loungeChannelId: null });
          musicService.stop();
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription('24/7 Lounge disabled. Bot disconnected.')] });
        } else {
          return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Lounge is already disabled.')] });
        }
      }

      // Enable Lounge
      const targetChannel = channelOpt || context.member.voice.channel;
      if (!targetChannel) {
        return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('Please provide a voice channel or join one.')] });
      }

      await setConfig(context.guild.id, { loungeEnabled: true, loungeChannelId: targetChannel.id });
      
      try {
        const playlistsPath = path.resolve('data/playlists.json');
        let playlistsData = { lounge_tracks: ['Krishna Das', 'Bhakti Sangeet'] };
        try {
          const raw = await fs.readFile(playlistsPath, 'utf-8');
          playlistsData = JSON.parse(raw);
        } catch (e) {
          console.warn('Playlists file not found, using defaults.');
        }

        const tracks = playlistsData.lounge_tracks || [];
        if (tracks.length === 0) {
          throw new Error('No tracks found in playlist.');
        }
        
        musicService.stop(); // Clear any existing queue
        musicService.setLoop('queue'); // Enable queue looping for 24/7 playback

        // Add a random track to start
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        await musicService.play(randomTrack, targetChannel, context.channel, context.client.user);

        // Add the rest to the queue
        for (const t of tracks) {
          if (t !== randomTrack) {
            // Add silently without auto-playing immediately
            try {
              const res = await import('play-dl').then(m => m.default.search(t, { limit: 1 }));
              if (res && res.length) {
                musicService.queue.push({
                  title: res[0].title,
                  url: res[0].url,
                  duration: res[0].durationRaw,
                  durationSec: res[0].durationInSec,
                  thumbnail: res[0].thumbnails[0]?.url,
                  requestedBy: context.client.user
                });
              }
            } catch (err) {
              console.error('Lounge track load error:', err);
            }
          }
        }

        const embed = new EmbedBuilder()
          .setColor(COLORS.GOLD)
          .setTitle(`${EMOJIS.TRIDENT || '🔱'} 24/7 Bhajan Lounge Enabled`)
          .setDescription(`Successfully bound to <#${targetChannel.id}>.\nThe bot will now play devotional tracks continuously.`)
          .setFooter({ text: 'Use /lounge enable:False to disable' });

        return context.editReply({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        return context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`Failed to setup lounge: ${err.message}`)] });
      }
    } catch (error) {
      console.error(error);
      await context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription('An error occurred executing lounge command.')] }).catch(() => {});
    }
  }
};
