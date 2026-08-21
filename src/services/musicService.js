import play from 'play-dl';
import youtubedl from 'youtube-dl-exec';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType,
  entersState
} from '@discordjs/voice';

const guildMusicManagers = new Map();

// Initialize SoundCloud client ID
let soundCloudInitialized = false;
async function initSoundCloud() {
  if (soundCloudInitialized) return true;
  try {
    const clientId = await play.getFreeClientID();
    if (clientId) {
      await play.setToken({ soundcloud: { client_id: clientId } });
      soundCloudInitialized = true;
      return true;
    }
  } catch (err) {
    console.warn('[MusicService] SoundCloud init warning:', err.message);
  }
  return false;
}
// Init immediately
initSoundCloud();

export class MusicManager {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.currentTrack = null;
    this.connection = null;
    this.player = createAudioPlayer();
    this.loopMode = 'off';
    this.isPlaying = false;
    this.idleTimeout = null;
    this.textChannel = null;

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.handleTrackEnd();
    });

    this.player.on('error', error => {
      console.error(`[MusicService] Player Error in guild ${this.guildId}:`, error.message);
      this.handleTrackEnd();
    });
  }

  async play(query, voiceChannel, textChannel, requestedBy) {
    this.textChannel = textChannel;
    await initSoundCloud();

    let trackInfo = null;

    // 1. Direct URL handling
    if (query.startsWith('http')) {
      if (query.includes('soundcloud.com')) {
        const scInfo = await play.soundcloud(query);
        trackInfo = {
          title: scInfo.name,
          url: scInfo.url,
          duration: 'Audio Track',
          durationSec: Math.floor((scInfo.durationInMs || 180000) / 1000),
          thumbnail: scInfo.thumbnail || 'https://i.imgur.com/8N4XW3p.png',
          requestedBy,
          source: 'soundcloud'
        };
      } else {
        const videoInfo = await play.video_info(query);
        trackInfo = {
          title: videoInfo.video_details.title,
          url: videoInfo.video_details.url,
          duration: videoInfo.video_details.durationRaw || '4:00',
          durationSec: videoInfo.video_details.durationInSec || 240,
          thumbnail: videoInfo.video_details.thumbnails[0]?.url || 'https://i.imgur.com/8N4XW3p.png',
          requestedBy,
          source: 'youtube'
        };
      }
    } else {
      // 2. Search query — try SoundCloud first for super fast instant playback (<1 second)
      if (soundCloudInitialized) {
        try {
          const scResults = await play.search(query, { limit: 1, source: { soundcloud: 'tracks' } });
          if (scResults && scResults.length > 0) {
            const track = scResults[0];
            trackInfo = {
              title: track.name,
              url: track.url,
              duration: 'Audio Track',
              durationSec: Math.floor((track.durationInMs || 180000) / 1000),
              thumbnail: track.thumbnail || 'https://i.imgur.com/8N4XW3p.png',
              requestedBy,
              source: 'soundcloud'
            };
          }
        } catch (scErr) {
          console.warn('[MusicService] SoundCloud search warning:', scErr.message);
        }
      }

      // 3. Fallback to YouTube search if SoundCloud had no match
      if (!trackInfo) {
        const ytResults = await play.search(query, { limit: 1, source: { youtube: 'video' } });
        if (ytResults && ytResults.length > 0) {
          const video = ytResults[0];
          trackInfo = {
            title: video.title,
            url: video.url,
            duration: video.durationRaw || '4:00',
            durationSec: video.durationInSec || 240,
            thumbnail: video.thumbnails[0]?.url || 'https://i.imgur.com/8N4XW3p.png',
            requestedBy,
            source: 'youtube'
          };
        }
      }
    }

    if (!trackInfo) {
      throw new Error('No audio tracks found for your search query.');
    }

    this.queue.push(trackInfo);

    if (!this.connection) {
      await this.connectToVoice(voiceChannel);
    }

    if (this.player.state.status === AudioPlayerStatus.Idle) {
      await this.playNext();
    }

    return trackInfo;
  }

  async connectToVoice(voiceChannel) {
    if (!voiceChannel || !voiceChannel.id || !voiceChannel.guild) {
      throw new Error('Invalid voice channel object or user is not in a voice channel.');
    }

    if (this.connection) {
      if (this.connection.joinConfig.channelId === voiceChannel.id && this.connection.state.status === VoiceConnectionStatus.Ready) {
        return;
      }
      try { this.connection.destroy(); } catch (e) {}
      this.connection = null;
    }

    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false
    });

    this.connection.subscribe(this.player);

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 15_000);
      console.log(`[MusicService] Voice connection successfully joined and ready in channel: ${voiceChannel.name}`);
    } catch (connErr) {
      console.warn(`[MusicService] Voice connection ready state warning:`, connErr.message);
    }

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5000)
        ]);
      } catch (error) {
        this.stop();
      }
    });
  }

  async playNext() {
    this.clearIdleTimeout();

    if (this.queue.length === 0 && !this.currentTrack) {
      this.isPlaying = false;
      this.setIdleTimeout();
      return;
    }

    if (!this.currentTrack || (this.loopMode !== 'track')) {
      if (this.loopMode === 'queue' && this.currentTrack) {
        this.queue.push(this.currentTrack);
      }
      this.currentTrack = this.queue.shift();
    }

    if (!this.currentTrack) {
      this.isPlaying = false;
      this.setIdleTimeout();
      return;
    }

    try {
      let resource = null;

      if (this.currentTrack.source === 'soundcloud') {
        const stream = await play.stream(this.currentTrack.url);
        resource = createAudioResource(stream.stream, { inputType: stream.type });
      } else {
        // Try yt-dlp first
        try {
          const rawUrl = await youtubedl(this.currentTrack.url, {
            getUrl: true,
            format: 'bestaudio/best',
            noWarnings: true,
            noCheckCertificates: true
          });
          const audioUrl = rawUrl.trim().split('\n')[0];
          resource = createAudioResource(audioUrl, { inputType: StreamType.Arbitrary });
        } catch (ytErr) {
          console.warn('[MusicService] yt-dlp stream error, checking SoundCloud fallback:', ytErr.message);
          if (soundCloudInitialized) {
            const scSearch = await play.search(this.currentTrack.title, { limit: 1, source: { soundcloud: 'tracks' } });
            if (scSearch && scSearch.length > 0) {
              const scStream = await play.stream(scSearch[0].url);
              resource = createAudioResource(scStream.stream, { inputType: scStream.type });
            }
          }
        }
      }

      if (!resource) {
        throw new Error('Unable to create audio resource from stream.');
      }

      this.player.play(resource);
      this.isPlaying = true;
    } catch (error) {
      console.error(`[MusicService] Stream playback error:`, error.message);
      if (this.textChannel) {
        this.textChannel.send(`⚠️ Could not stream **${this.currentTrack.title}**. Skipping to next track...`).catch(() => {});
      }
      this.currentTrack = null;
      this.playNext();
    }
  }

  handleTrackEnd() {
    this.isPlaying = false;
    if (this.loopMode !== 'track') {
      this.currentTrack = null;
    }
    this.playNext();
  }

  skip() {
    this.player.stop();
  }

  pause() {
    if (this.isPlaying) {
      this.player.pause();
      this.isPlaying = false;
      return true;
    }
    return false;
  }

  resume() {
    if (!this.isPlaying && this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
      this.isPlaying = true;
      return true;
    }
    return false;
  }

  stop() {
    this.queue = [];
    this.currentTrack = null;
    this.loopMode = 'off';
    this.player.stop();
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    this.isPlaying = false;
    this.clearIdleTimeout();
  }

  setLoop(mode) {
    if (['off', 'track', 'queue'].includes(mode)) {
      this.loopMode = mode;
      return true;
    }
    return false;
  }

  getQueue() {
    return this.queue;
  }

  getNowPlaying() {
    return this.currentTrack;
  }

  setIdleTimeout() {
    this.idleTimeout = setTimeout(() => {
      this.stop();
    }, 5 * 60 * 1000); // 5 minutes
  }

  clearIdleTimeout() {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }
}

export function getMusicService(guildId) {
  if (!guildMusicManagers.has(guildId)) {
    guildMusicManagers.set(guildId, new MusicManager(guildId));
  }
  return guildMusicManagers.get(guildId);
}

export function destroyMusicService(guildId) {
  const manager = guildMusicManagers.get(guildId);
  if (manager) {
    manager.stop();
    guildMusicManagers.delete(guildId);
  }
}
