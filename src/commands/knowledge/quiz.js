import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { supabase, isDatabaseAvailable } from '../../config/supabase.js';
import fs from 'fs/promises';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('quiz')
    .setDescription('Take a short interactive trivia quiz about Sanatana Dharma.'),
  category: 'knowledge',
  execute: async (interaction, context) => {
    try {
      const { user, reply } = context;

      const dataPath = path.join(process.cwd(), 'data', 'quiz-questions.json');
      let dataRaw;
      try {
        dataRaw = await fs.readFile(dataPath, 'utf-8');
      } catch (err) {
        return reply({ content: 'Quiz questions are currently unavailable.' });
      }
      
      const questions = JSON.parse(dataRaw);
      if (!questions || questions.length === 0) {
        return reply({ content: 'Quiz questions are currently unavailable.' });
      }

      const q = questions[Math.floor(Math.random() * questions.length)];
      
      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.TRIDENT || '🔱'} Sanatana Dharma Quiz`)
        .setDescription(q.question)
        .addFields(
          { name: 'Difficulty', value: q.difficulty || 'Medium', inline: true },
          { name: 'Source', value: q.source || 'Unknown', inline: true }
        )
        .setColor(COLORS.SAFFRON || 0xFF9933);

      const row = new ActionRowBuilder();
      const optionsMap = ['A', 'B', 'C', 'D'];
      
      q.options.forEach((opt, idx) => {
        const letter = optionsMap[idx];
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`quiz_${idx}_${user.id}`)
            .setLabel(`${letter}. ${opt}`)
            .setStyle(ButtonStyle.Primary)
        );
      });

      const message = await reply({ embeds: [embed], components: [row] });
      const channel = context.isSlash ? interaction.channel : message.channel;

      const filter = i => i.customId.startsWith('quiz_') && i.customId.endsWith(`_${user.id}`);
      const collector = channel.createMessageComponentCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async i => {
        const selectedIdx = parseInt(i.customId.split('_')[1]);
        const isCorrect = selectedIdx === q.correctIndex;
        
        const resultEmbed = EmbedBuilder.from(embed)
          .setColor(isCorrect ? COLORS.GREEN || 0x228B22 : COLORS.RED || 0xFF0000)
          .setDescription(`${q.question}\n\n**Your Answer:** ${q.options[selectedIdx]}\n**Correct Answer:** ${q.options[q.correctIndex]}`)
          .addFields({ name: 'Explanation', value: q.explanation || 'No explanation provided.' });

        const disabledRow = new ActionRowBuilder();
        q.options.forEach((opt, idx) => {
          const letter = optionsMap[idx];
          const btn = new ButtonBuilder()
            .setCustomId(`quiz_${idx}_disabled`)
            .setLabel(`${letter}. ${opt}`)
            .setStyle(idx === q.correctIndex ? ButtonStyle.Success : (idx === selectedIdx ? ButtonStyle.Danger : ButtonStyle.Secondary))
            .setDisabled(true);
          disabledRow.addComponents(btn);
        });

        await i.update({ embeds: [resultEmbed], components: [disabledRow] });

        if (isDatabaseAvailable()) {
          try {
            const { data: userData } = await supabase.from('quiz_scores').select('*').eq('user_id', user.id).single();
            if (userData) {
              const newStreak = isCorrect ? userData.current_streak + 1 : 0;
              const bestStreak = Math.max(userData.best_streak, newStreak);
              await supabase.from('quiz_scores').update({
                correct_answers: userData.correct_answers + (isCorrect ? 1 : 0),
                total_answers: userData.total_answers + 1,
                current_streak: newStreak,
                best_streak: bestStreak
              }).eq('user_id', user.id);
            } else {
              await supabase.from('quiz_scores').insert({
                user_id: user.id,
                username: user.username,
                correct_answers: isCorrect ? 1 : 0,
                total_answers: 1,
                current_streak: isCorrect ? 1 : 0,
                best_streak: isCorrect ? 1 : 0
              });
            }
          } catch (e) {
            console.error('Failed to update quiz score', e);
          }
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          const timeoutEmbed = EmbedBuilder.from(embed)
            .setColor(COLORS.RED || 0xFF0000)
            .setDescription(`${q.question}\n\n**Time's up!**\n**Correct Answer:** ${q.options[q.correctIndex]}`);
            
          const disabledRow = new ActionRowBuilder();
          q.options.forEach((opt, idx) => {
            const letter = optionsMap[idx];
            disabledRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`quiz_${idx}_disabled`)
                .setLabel(`${letter}. ${opt}`)
                .setStyle(idx === q.correctIndex ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(true)
            );
          });
          
          if (context.isSlash) {
            interaction.editReply({ embeds: [timeoutEmbed], components: [disabledRow] }).catch(() => {});
          } else {
            message.edit({ embeds: [timeoutEmbed], components: [disabledRow] }).catch(() => {});
          }
        }
      });
    } catch (error) {
      console.error(error);
      context.reply({ content: 'An error occurred while fetching the quiz.' });
    }
  }
};
