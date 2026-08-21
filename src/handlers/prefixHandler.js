import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../config/constants.js';

export async function handlePrefixCommand(message, client) {
  // Check prefix
  const prefix = 'jai ';
  const content = message.content.trim();
  
  if (!content.toLowerCase().startsWith(prefix)) return false;
  
  const args = content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  if (!commandName) return false;

  const command = client.commands.get(commandName) || client.commands.get(client.commandAliases?.get(commandName));
  
  if (!command) return false; // Command not found

  // Handle subcommands (if any)
  let subcommand = null;
  if (args.length > 0) {
    const potentialSubcommand = args[0].toLowerCase();
    // A crude check if the command definition has this subcommand
    if (command.data.options && command.data.options.some(opt => opt.name === potentialSubcommand && (opt.type === 1 || opt.type === 2))) {
       subcommand = args.shift().toLowerCase();
    }
  }

  // Permission check
  if (command.permissions && command.permissions.length > 0) {
    const missingPerms = command.permissions.filter(perm => !message.member.permissions.has(perm));
    if (missingPerms.length > 0) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.RED || 0xFF0000)
        .setDescription(`${EMOJIS.TRIDENT || '🔱'} You do not have permission to use this command.`);
      await message.reply({ embeds: [embed] });
      return true;
    }
  }

  let lastReply = null;

  const context = {
    isSlash: false,
    guild: message.guild,
    channel: message.channel,
    user: message.author,
    member: message.member,
    client: client,
    args: args,
    subcommand: subcommand,
    reply: async (options) => {
      const payload = typeof options === 'string' ? { content: options } : options;
      lastReply = await message.reply(payload);
      return lastReply;
    },
    followUp: async (options) => {
      const payload = typeof options === 'string' ? { content: options } : options;
      const msg = await message.channel.send(payload);
      return msg;
    },
    defer: async () => {
      await message.channel.sendTyping();
    },
    editReply: async (options) => {
      const payload = typeof options === 'string' ? { content: options } : options;
      if (lastReply) {
         return await lastReply.edit(payload);
      }
      return await context.reply(payload);
    },
  };

  try {
    await command.execute(message, context);
  } catch (error) {
    console.error(`Error executing prefix command ${commandName}:`, error);
    const errorEmbed = new EmbedBuilder()
      .setColor(COLORS.RED || 0xFF0000)
      .setTitle('Error')
      .setDescription('An error occurred while executing the command.');
    
    try {
      if (lastReply) {
        await lastReply.edit({ embeds: [errorEmbed], content: null });
      } else {
        await message.reply({ embeds: [errorEmbed] });
      }
    } catch (e) {
      console.error('Error sending error reply:', e);
    }
  }

  return true; // Indicates it was a prefix command
}
