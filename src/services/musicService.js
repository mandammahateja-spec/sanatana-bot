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

// Initialize SoundCloud client ID once at startup
let soundCloudInitialized = false;
async function initSoundCloud() {
  if (soundCloudInitialized) return;
  try {
    const clientId = await play.getFreeClientID();
    if (clientId) {
      await play.setToken({ soundcloud: { client_id: clientId } });
      soundCloudInitialized = true;
    }
  } catch (err) {
    console.warn('[MusicService] Failed to init SoundCloud client ID:', err.message);
  }
}
initSoundCloud();

export class MusicManager {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.currentTrack = null;
    this.connection = null;
    this.player = createAudioPlayer();
    this.loopMode = 'off'; // 'off' | 'track' | 'queue'
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

    try {
      let trackInfo;
      if (query.startsWith('http')) {
        if (query.includes('soundcloud.com')) {
          const scInfo = await play.soundcloud(query);
          trackInfo = {
            title: scInfo.name,
            url: scInfo.url,
            duration: 'Track',
            durationSec: Math.floor(scInfo.durationInMs / 1000),
            thumbnail: scInfo.thumbnail,
            requestedBy,
            source: 'soundcloud'
          };
        } else {
          const videoInfo = await play.video_info(query);
          trackInfo = {
            title: videoInfo.video_details.title,
            url: videoInfo.video_details.url,
            duration: videoInfo.video_details.durationRaw,
            durationSec: videoInfo.video_details.durationInSec,
            thumbnail: videoInfo.video_details.thumbnails[0]?.url,
            requestedBy,
            source: 'youtube'
          };
        }
      } else {
        // Try YouTube search first
        try {
          const searchResults = await play.search(query, { limit: 1, source: { youtube: 'video' } });
          if (searchResults && searchResults.length > 0) {
            const video = searchResults[0];
            trackInfo = {
              title: video.title,
              url: video.url,
              duration: video.durationRaw,
              durationSec: video.durationInSec,
              thumbnail: video.thumbnails[0]?.url,
              requestedBy,
              source: 'youtube'
            };
          }
        } catch (ytSearchErr) {
          console.warn('[MusicService] YouTube search failed, attempting SoundCloud:', ytSearchErr.message);
        }

        // Fallback to SoundCloud search if YouTube search yielded nothing
        if (!trackInfo && soundCloudInitialized) {
          const scResults = await play.search(query, { limit: 1, source: { soundcloud: 'tracks' } });
          if (scResults && scResults.length > 0) {
            const track = scResults[0];
            trackInfo = {
              title: track.name,
              url: track.url,
              duration: 'Track',
              durationSec: Math.floor(track.durationInMs / 1000),
              thumbnail: track.thumbnail,
              requestedBy,
              source: 'soundcloud'
            };
          }
        }

        if (!trackInfo) {
          throw new Error('No results found for your search query.');
        }
      }

      this.queue.push(trackInfo);

      if (!this.connection) {
        await this.connectToVoice(voiceChannel);
      }

      if (this.player.state.status === AudioPlayerStatus.Idle) {
        await this.playNext();
      }

      return trackInfo;
    } catch (error) {
      console.error(`[MusicService] Play error:`, error);
      throw error;
    }
  }

  async connectToVoice(voiceChannel) {
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
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
      let resource;
      
      if (this.currentTrack.source === 'soundcloud') {
        const stream = await play.stream(this.currentTrack.url);
        resource = createAudioResource(stream.stream, { inputType: stream.type });
      } else {
        // YouTube track: try yt-dlp first for robust playback, fallback to SoundCloud search
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
          console.warn('[MusicService] yt-dlp stream extraction failed, attempting SoundCloud fallback:', ytErr.message);
          
          // SoundCloud audio fallback
          if (soundCloudInitialized) {
            const scSearch = await play.search(this.currentTrack.title, { limit: 1, source: { soundcloud: 'tracks' } });
            if (scSearch && scSearch.length > 0) {
              const scStream = await play.stream(scSearch[0].url);
              resource = createAudioResource(scStream.stream, { inputType: scStream.type });
            }
          }
          
          if (!resource) {
            // Direct play-dl attempt as final fallback
            const fallbackStream = await play.stream(this.currentTrack.url);
            resource = createAudioResource(fallbackStream.stream, { inputType: fallbackStream.type });
          }
        }
      }

      this.player.play(resource);
      this.isPlaying = true;
    } catch (error) {
      console.error(`[MusicService] Streaming error:`, error);
      if (this.textChannel) {
        this.textChannel.send(`⚠️ Could not stream **${this.currentTrack.title}**. Moving to next song...`).catch(() => {});
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
