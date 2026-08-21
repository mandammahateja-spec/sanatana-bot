import cron from 'node-cron';
import { supabase, isDatabaseAvailable } from '../config/supabase.js';
import { postDailyShloka } from './dailyShloka.js';
import { postDailyQuote } from './dailyQuote.js';
import { checkFestivalReminders } from './festivalReminder.js';
import { getConfig } from '../models/guildConfig.js';
import { DEFAULT_TIMEZONE } from '../config/constants.js';

// Store active jobs to allow for refreshing
const activeJobs = new Map(); // Key: guildId, Value: { shlokaJob, quoteJob, festivalJob }

export const startScheduler = async (client) => {
  console.log('Starting cron scheduler...');
  
  if (!isDatabaseAvailable) {
    console.warn('Database is unavailable. Skipping global cron setup.');
    return;
  }

  try {
    const { data: configs, error } = await supabase.from('guild_configs').select('*');
    if (error) throw error;

    for (const config of configs) {
      if (config.daily_channel_id) {
        await setupGuildCron(client, config.guild_id, config.daily_channel_id, config.timezone || DEFAULT_TIMEZONE);
      }
    }
    console.log(`Cron scheduler started for ${configs.length} guilds.`);
  } catch (error) {
    console.error('Error starting cron scheduler:', error);
  }
};

const setupGuildCron = async (client, guildId, channelId, timezone) => {
  // Clean up existing jobs for this guild
  if (activeJobs.has(guildId)) {
    const jobs = activeJobs.get(guildId);
    if (jobs.shlokaJob) jobs.shlokaJob.stop();
    if (jobs.quoteJob) jobs.quoteJob.stop();
    if (jobs.festivalJob) jobs.festivalJob.stop();
    activeJobs.delete(guildId);
  }

  // 6:00 AM for Shloka
  const shlokaJob = cron.schedule('0 6 * * *', () => {
    postDailyShloka(client, guildId, channelId);
  }, { timezone });

  // 7:00 AM for Quote
  const quoteJob = cron.schedule('0 7 * * *', () => {
    postDailyQuote(client, guildId, channelId);
  }, { timezone });

  // 8:00 AM for Festival Reminder
  const festivalJob = cron.schedule('0 8 * * *', () => {
    checkFestivalReminders(client, guildId, channelId);
  }, { timezone });

  activeJobs.set(guildId, { shlokaJob, quoteJob, festivalJob });
};

export const refreshScheduler = async (client, guildId) => {
  try {
    const config = await getConfig(guildId);
    if (config && config.daily_channel_id) {
      await setupGuildCron(client, guildId, config.daily_channel_id, config.timezone || DEFAULT_TIMEZONE);
      console.log(`Refreshed cron jobs for guild ${guildId}`);
    } else {
      // If daily channel was removed, just stop the jobs
      if (activeJobs.has(guildId)) {
        const jobs = activeJobs.get(guildId);
        if (jobs.shlokaJob) jobs.shlokaJob.stop();
        if (jobs.quoteJob) jobs.quoteJob.stop();
        if (jobs.festivalJob) jobs.festivalJob.stop();
        activeJobs.delete(guildId);
        console.log(`Removed cron jobs for guild ${guildId}`);
      }
    }
  } catch (error) {
    console.error(`Error refreshing scheduler for guild ${guildId}:`, error);
  }
};
