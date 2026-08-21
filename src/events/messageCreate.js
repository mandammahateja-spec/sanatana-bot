import { handlePrefixCommand } from '../handlers/prefixHandler.js';
import { handleSloganReply } from '../handlers/sloganHandler.js';

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;

    try {
      const isCommand = await handlePrefixCommand(message, client);
      if (!isCommand) {
        await handleSloganReply(message, client);
      }
    } catch (error) {
      console.error('Error handling messageCreate:', error);
    }
  }
};
