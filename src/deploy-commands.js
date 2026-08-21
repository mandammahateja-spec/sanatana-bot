import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { loadCommands, getCommandsArray } from './handlers/commandHandler.js';

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
  console.error("Missing CLIENT_ID or DISCORD_TOKEN in environment variables.");
  process.exit(1);
}

const args = process.argv.slice(2);
const globalDeploy = args.includes('--global');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function deployCommands() {
  try {
    console.log('Loading commands...');
    await loadCommands(client, './src/commands');
    
    const commands = getCommandsArray(client);
    
    if (commands.length === 0) {
      console.log('No commands found to deploy. Please create some commands in src/commands first (this is normal during initial setup if commands dir is empty).');
      return;
    }
    
    const rest = new REST({ version: '10' }).setToken(token);

    if (globalDeploy) {
      console.log(`Started refreshing ${commands.length} application (/) commands globally.`);
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
    } else {
      if (!guildId) {
        console.error("Missing GUILD_ID in environment variables for local deploy.");
        return;
      }
      console.log(`Started refreshing ${commands.length} application (/) commands for guild ${guildId}.`);
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`);
    }
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
}

deployCommands();
