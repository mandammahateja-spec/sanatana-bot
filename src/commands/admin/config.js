import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { getConfig, setConfig } from '../../models/guildConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure guild settings for the bot')
    .addSubcommand(subcommand =>
      subcommand
        .setName('daily-channel')
        .setDescription('Set the channel for daily spiritual content')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to post daily content')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('mod-log')
        .setDescription('Set the channel for moderation logs')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to post mod logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('timezone')
        .setDescription('Set the timezone for daily content')
        .addStringOption(option => 
          option.setName('tz')
            .setDescription('Timezone (e.g., Asia/Kolkata)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('auto-reply')
        .setDescription('Enable or disable auto-replies (e.g., Ram Ram)')
        .addStringOption(option => 
          option.setName('state')
            .setDescription('On or Off')
            .setRequired(true)
            .addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' })))
    .addSubcommand(subcommand =>
      subcommand
        .setName('auto-reply-mode')
        .setDescription('Set the auto-reply mode')
        .addStringOption(option => 
          option.setName('mode')
            .setDescription('Text or Emoji mode')
            .setRequired(true)
            .addChoices({ name: 'Text', value: 'text' }, { name: 'Emoji', value: 'emoji' }))),
  category: 'admin',
  permissions: [PermissionFlagsBits.ManageGuild],
  execute: async (interaction, context) => {
    const { guild, member: moderator } = context;

    if (!moderator.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You need Manage Server permission to use this command.`)] });
    }

    let subcmd, args = {};

    if (context.isSlash) {
      subcmd = interaction.options.getSubcommand();
      args.channel = interaction.options.getChannel('channel');
      args.tz = interaction.options.getString('tz');
      args.state = interaction.options.getString('state');
      args.mode = interaction.options.getString('mode');
    } else {
      subcmd = context.args[0];
      if (!subcmd) return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Please specify a subcommand: daily-channel, mod-log, timezone, auto-reply, auto-reply-mode`)] });
      
      if (['daily-channel', 'mod-log'].includes(subcmd)) {
        const chanId = context.args[1]?.replace(/[<#>]/g, '');
        args.channel = guild.channels.cache.get(chanId);
        if (!args.channel) return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Invalid channel.`)] });
      } else if (subcmd === 'timezone') {
        args.tz = context.args[1];
      } else if (subcmd === 'auto-reply') {
        args.state = context.args[1];
      } else if (subcmd === 'auto-reply-mode') {
        args.mode = context.args[1];
      }
    }

    try {
      let key, value, displayValue;

      switch (subcmd) {
        case 'daily-channel':
          key = 'daily_channel_id';
          value = args.channel.id;
          displayValue = `<#${value}>`;
          break;
        case 'mod-log':
          key = 'mod_log_channel_id';
          value = args.channel.id;
          displayValue = `<#${value}>`;
          break;
        case 'timezone':
          // Basic tz validation
          try { Intl.DateTimeFormat(undefined, {timeZone: args.tz}); }
          catch (ex) { return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Invalid timezone.`)] }); }
          key = 'timezone';
          value = args.tz;
          displayValue = value;
          break;
        case 'auto-reply':
          key = 'auto_reply_enabled';
          value = args.state === 'on';
          displayValue = value ? 'Enabled' : 'Disabled';
          break;
        case 'auto-reply-mode':
          key = 'auto_reply_mode';
          value = args.mode;
          displayValue = value;
          break;
        default:
          return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Invalid subcommand.`)] });
      }

      const success = await setConfig(guild.id, key, value);

      if (success) {
        const embed = new EmbedBuilder()
          .setColor(COLORS.GREEN)
          .setTitle(`${EMOJIS.SUCCESS} Configuration Updated`)
          .setDescription(`Successfully set **${subcmd}** to ${displayValue}.`);
        await context.reply({ embeds: [embed] });
      } else {
        await context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Failed to update configuration. Database might be unavailable.`)] });
      }

    } catch (error) {
      console.error('Config error:', error);
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while updating the configuration.`)] });
    }
  }
};
