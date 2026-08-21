import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { Collection } from 'discord.js';

/**
 * Loads all commands from the given directory recursively.
 * @param {Client} client 
 * @param {string} dir 
 */
export async function loadCommands(client, dir = './src/commands') {
  if (!client.commands) {
    client.commands = new Collection();
  }
  if (!client.commandAliases) {
    client.commandAliases = new Collection();
  }

  let commandFiles = [];
  
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        const nestedFiles = readdirSync(filePath);
        for (const nestedFile of nestedFiles) {
           const nestedFilePath = join(filePath, nestedFile);
           if (statSync(nestedFilePath).isFile() && nestedFilePath.endsWith('.js')) {
             commandFiles.push(nestedFilePath);
           }
        }
      } else if (file.endsWith('.js')) {
        commandFiles.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading commands directory: ${error.message}`);
    return;
  }

  for (const filePath of commandFiles) {
    try {
      // Need to convert path to file URL for dynamic import on Windows
      const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
      const commandModule = await import(fileUrl);
      const command = commandModule.default;

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        if (command.aliases && Array.isArray(command.aliases)) {
          command.aliases.forEach(alias => {
            client.commandAliases.set(alias, command.data.name);
          });
        }
        console.log(`Loaded command: ${command.data.name}`);
      } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
    }
  }
}

/**
 * Gets an array of command data for deployment.
 * @param {Client} client 
 * @returns {Array} Array of command JSON data
 */
export function getCommandsArray(client) {
  if (!client.commands) return [];
  return client.commands.map(cmd => cmd.data.toJSON());
}
