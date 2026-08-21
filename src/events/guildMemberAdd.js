import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config/constants.js';

export default {
  name: 'guildMemberAdd',
  async execute(member) {
    if (member.user.bot) return;

    try {
      const systemChannel = member.guild.systemChannel || member.guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(member.guild.members.me).has('SendMessages'));
      
      if (!systemChannel) return;

      const embed = new EmbedBuilder()
        .setColor(COLORS.SAFFRON || 0xFF9933)
        .setTitle(`Welcome to our Spiritual Community! ${EMOJIS.OM || '🕉️'}`)
        .setDescription(`Namaste ${member.toString()}, welcome to **${member.guild.name}**!\n\nWe are blessed to have you join our sangha.`)
        .setFooter({ text: 'Type /help to explore bot commands' })
        .setTimestamp();

      await systemChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Error sending welcome message in ${member.guild.name}:`, error);
    }
  }
};
