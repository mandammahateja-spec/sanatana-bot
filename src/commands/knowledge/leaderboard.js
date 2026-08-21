import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { supabase, isDatabaseAvailable } from '../../config/supabase.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the top 10 quiz scores on the server.'),
  category: 'knowledge',
  execute: async (interaction, context) => {
    try {
      const { reply } = context;

      if (!isDatabaseAvailable()) {
        return reply({ content: 'Database is currently unavailable. Cannot fetch the leaderboard.' });
      }

      const { data, error } = await supabase
        .from('quiz_scores')
        .select('*')
        .order('correct_answers', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Leaderboard Fetch Error:', error);
        return reply({ content: 'An error occurred while fetching the leaderboard.' });
      }

      if (!data || data.length === 0) {
        return reply({ content: 'No quiz scores found yet! Be the first to use the `/quiz` command.' });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.OM || '🕉️'} Sanatana Bot - Quiz Leaderboard`)
        .setColor(COLORS.GOLD || 0xFFD700)
        .setDescription('Top 10 devotees with the highest quiz scores!');

      let description = '';
      data.forEach((row, index) => {
        let rankEmoji = '🔹';
        if (index === 0) rankEmoji = '🥇';
        else if (index === 1) rankEmoji = '🥈';
        else if (index === 2) rankEmoji = '🥉';

        description += `${rankEmoji} **#${index + 1}** <@${row.user_id}>\n`;
        description += `└ Correct: **${row.correct_answers}** / ${row.total_answers} | Best Streak: **${row.best_streak}**\n\n`;
      });

      embed.setDescription(description || 'No data.');

      await reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
