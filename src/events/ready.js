import { ActivityType } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    console.log(`Serving ${client.guilds.cache.size} servers.`);

    client.user.setActivity('🕉️ Jai Shree Krishna | /help', { type: ActivityType.Custom });

    try {
      const { startScheduler } = await import('../cron/scheduler.js');
      if (startScheduler) {
        startScheduler(client);
        console.log('Cron scheduler started.');
      }
    } catch (error) {
      console.log('Scheduler module not found or failed to load. Skipping scheduler.');
    }
  }
};
