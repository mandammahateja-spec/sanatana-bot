import 'dotenv/config';
import ffmpegPath from 'ffmpeg-static';
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

// Set FFmpeg path for prism-media / @discordjs/voice
if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

import { loadCommands } from './handlers/commandHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
});

client.commands = new Collection();
client.commandAliases = new Collection();

async function init() {
  try {
    // Load commands
    await loadCommands(client, join(__dirname, 'commands'));

    // Load events
    const eventsPath = join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      const eventModule = await import(fileUrl);
      const event = eventModule.default;
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      console.log(`Loaded event: ${event.name}`);
    }

    // Login
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Global error handlers to prevent crashes
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

init();
