import { ActivityType } from 'discord.js';
import { startScheduler } from '../cron/scheduler.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} servers.`);

    client.user.setActivity('🕉️ Jai Shree Krishna | /help', { type: ActivityType.Custom });

    try {
      if (startScheduler) {
        startScheduler(client);
        console.log('Cron scheduler started.');
      }
    } catch (error) {
      console.log('Error initializing cron scheduler:', error.message);
    }
  }
};
