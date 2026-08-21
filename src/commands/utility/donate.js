import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';

export default {
  data: new SlashCommandBuilder()
    .setName('donate-info')
    .setDescription('Get information on how to support through Seva/Donation.'),
  category: 'utility',
  execute: async (interaction, context) => {
    try {
      const { reply } = context;

      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.PRAY || '🙏'} Support Our Mission (Seva)`)
        .setDescription('Your generous contributions help us maintain the server, host events, and support the community.')
        .setColor(COLORS.GOLD || 0xFFD700)
        .addFields(
          { name: 'UPI', value: 'example@upi', inline: true },
          { name: 'PayPal', value: 'paypal.me/example', inline: true },
          { name: 'Patreon', value: 'patreon.com/example', inline: true },
          { name: 'Note', value: 'Admins can configure these details in the bot settings.' }
        )
        .setFooter({ text: 'May the divine bless you for your support.' });

      await reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      context.reply({ content: 'An unexpected error occurred.' });
    }
  }
};
