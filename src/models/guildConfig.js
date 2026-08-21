import { supabase, isDatabaseAvailable } from '../config/supabase.js';

const DEFAULT_CONFIG = {
  daily_channel_id: null,
  mod_log_channel_id: null,
  timezone: 'Asia/Kolkata',
  auto_reply_enabled: true,
  auto_reply_mode: 'text',
  features: {
    music: true,
    quiz: true,
    daily: true,
    autoReply: true
  },
  shloka_index: 0
};

export async function getConfig(guildId) {
  if (!isDatabaseAvailable()) return { ...DEFAULT_CONFIG };

  try {
    const { data, error } = await supabase
      .from('guild_configs')
      .select('*')
      .eq('guild_id', guildId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return { ...DEFAULT_CONFIG };
      }
      console.error('Error fetching guild config:', error);
      return { ...DEFAULT_CONFIG };
    }

    return { ...DEFAULT_CONFIG, ...data };
  } catch (error) {
    console.error('Exception fetching guild config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

export async function setConfig(guildId, key, value) {
  if (!isDatabaseAvailable()) return false;

  try {
    const currentConfig = await getOrCreateConfig(guildId);
    
    // If setting a feature toggle, merge it with existing features
    let updates = {};
    if (key === 'features') {
       updates = { features: { ...currentConfig.features, ...value } };
    } else {
       updates = { [key]: value };
    }

    const { error } = await supabase
      .from('guild_configs')
      .upsert({ guild_id: guildId, ...updates })
      .eq('guild_id', guildId);

    if (error) {
      console.error('Error setting guild config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception setting guild config:', error);
    return false;
  }
}

export async function getOrCreateConfig(guildId) {
  if (!isDatabaseAvailable()) return { ...DEFAULT_CONFIG };

  try {
    const { data, error } = await supabase
      .from('guild_configs')
      .select('*')
      .eq('guild_id', guildId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        const { data: insertData, error: insertError } = await supabase
          .from('guild_configs')
          .insert({ guild_id: guildId, ...DEFAULT_CONFIG })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating guild config:', insertError);
          return { ...DEFAULT_CONFIG };
        }
        return insertData;
      }
      console.error('Error fetching guild config:', error);
      return { ...DEFAULT_CONFIG };
    }

    return { ...DEFAULT_CONFIG, ...data };
  } catch (error) {
    console.error('Exception fetching guild config:', error);
    return { ...DEFAULT_CONFIG };
  }
}
