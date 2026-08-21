import { supabase, isDatabaseAvailable } from '../config/supabase.js';

export async function addLog({ guildId, moderatorId, targetId, action, reason, duration }) {
  if (!isDatabaseAvailable()) return null;

  try {
    const { data, error } = await supabase
      .from('mod_logs')
      .insert({
        guild_id: guildId,
        moderator_id: moderatorId,
        target_id: targetId,
        action,
        reason,
        duration,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding mod log:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception adding mod log:', error);
    return null;
  }
}

export async function getLogs(guildId, limit = 10, offset = 0) {
  if (!isDatabaseAvailable()) return [];

  try {
    const { data, error } = await supabase
      .from('mod_logs')
      .select('*')
      .eq('guild_id', guildId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching mod logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching mod logs:', error);
    return [];
  }
}

export async function getWarnings(guildId, userId) {
  if (!isDatabaseAvailable()) return [];

  try {
    const { data, error } = await supabase
      .from('warnings')
      .select('*')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching warnings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching warnings:', error);
    return [];
  }
}

export async function addWarning({ guildId, userId, moderatorId, reason }) {
  if (!isDatabaseAvailable()) return null;

  try {
    const { data, error } = await supabase
      .from('warnings')
      .insert({
        guild_id: guildId,
        user_id: userId,
        moderator_id: moderatorId,
        reason,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding warning:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception adding warning:', error);
    return null;
  }
}

export async function getWarningCount(guildId, userId) {
  if (!isDatabaseAvailable()) return 0;

  try {
    const { count, error } = await supabase
      .from('warnings')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', guildId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting warning count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Exception getting warning count:', error);
    return 0;
  }
}
