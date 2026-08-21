import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config/constants.js';
import { addLog } from '../models/modLog.js';
import { getConfig } from '../models/guildConfig.js';

export function buildModLogEmbed({ action, moderator, target, reason, duration }) {
  let color = COLORS.RED;
  if (['warn', 'timeout', 'mute'].includes(action)) color = COLORS.MAROON;
  if (['unban', 'untimeout', 'unmute'].includes(action)) color = COLORS.GREEN;

  const actionMap = {
    kick: 'Kicked',
    ban: 'Banned',
    unban: 'Unbanned',
    timeout: 'Timed Out',
    untimeout: 'Timeout Removed',
    warn: 'Warned',
    mute: 'Muted',
    unmute: 'Unmuted'
  };

  const embed = new EmbedBuilder()
    .setTitle(`Mod Action: ${actionMap[action] || action}`)
    .setColor(color)
    .addFields(
      { name: 'Target User', value: `${target.tag || target.user?.tag || target} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag || moderator.user?.tag} (${moderator.id})`, inline: true }
    )
    .setTimestamp();

  if (reason) {
    embed.addFields({ name: 'Reason', value: reason });
  }

  if (duration) {
    embed.addFields({ name: 'Duration', value: String(duration) });
  }

  return embed;
}

export async function dmUser(user, embed) {
  try {
    await user.send({ embeds: [embed] });
    return true;
  } catch (error) {
    // Fail silently if DM fails
    return false;
  }
}

export async function logModAction(guild, { moderatorId, targetId, action, reason, duration, targetUser, moderatorUser }) {
  // Log to database
  await addLog({ guildId: guild.id, moderatorId, targetId, action, reason, duration });

  // Log to mod channel if configured
  const config = await getConfig(guild.id);
  if (config.mod_log_channel_id) {
    try {
      const logChannel = await guild.channels.fetch(config.mod_log_channel_id);
      if (logChannel) {
        const embed = buildModLogEmbed({ 
          action, 
          moderator: moderatorUser || { id: moderatorId, tag: moderatorId }, 
          target: targetUser || { id: targetId, tag: targetId }, 
          reason, 
          duration 
        });
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Failed to send mod log to channel:', error);
    }
  }
}
