import { supabase, isDatabaseAvailable } from '../config/supabase.js';

export async function updateScore(guildId, userId, isCorrect) {
  if (!isDatabaseAvailable()) return null;

  try {
    const { data: currentScore, error: fetchError } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching quiz score:', fetchError);
      return null;
    }

    const updates = {
      guild_id: guildId,
      user_id: userId,
      total_answers: (currentScore?.total_answers || 0) + 1,
      correct_answers: currentScore?.correct_answers || 0,
      streak: currentScore?.streak || 0,
      last_played_at: new Date().toISOString()
    };

    if (isCorrect) {
      updates.correct_answers += 1;
      updates.streak += 1;
    } else {
      updates.streak = 0;
    }

    const { data, error } = await supabase
      .from('quiz_scores')
      .upsert(updates)
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating quiz score:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception updating quiz score:', error);
    return null;
  }
}

export async function getLeaderboard(guildId, limit = 10) {
  if (!isDatabaseAvailable()) return [];

  try {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('guild_id', guildId)
      .order('correct_answers', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching quiz leaderboard:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching quiz leaderboard:', error);
    return [];
  }
}

export async function getUserScore(guildId, userId) {
  if (!isDatabaseAvailable()) return { total_answers: 0, correct_answers: 0, streak: 0 };

  try {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { total_answers: 0, correct_answers: 0, streak: 0 };
      }
      console.error('Error fetching user score:', error);
      return { total_answers: 0, correct_answers: 0, streak: 0 };
    }

    return data;
  } catch (error) {
    console.error('Exception fetching user score:', error);
    return { total_answers: 0, correct_answers: 0, streak: 0 };
  }
}
