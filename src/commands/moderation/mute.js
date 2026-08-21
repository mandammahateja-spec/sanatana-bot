import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/constants.js';
import { logModAction, dmUser } from '../../services/modLogService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a member by adding a Muted role')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for mute')
        .setRequired(false)),
  category: 'moderation',
  permissions: [PermissionFlagsBits.ManageRoles],
  execute: async (interaction, context) => {
    const { guild, member: moderator, user: modUser } = context;
    
    let targetUser, reason;
    
    if (context.isSlash) {
      targetUser = interaction.options.getUser('user');
      reason = interaction.options.getString('reason') || 'No reason provided';
    } else {
      targetUser = context.args[0] ? context.message.mentions.users.first() || await context.client.users.fetch(context.args[0]).catch(() => null) : null;
      reason = context.args.slice(1).join(' ') || 'No reason provided';
    }

    if (!targetUser) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} Usage: /mute <user> [reason]`)] });
    }

    if (!moderator.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You do not have permission to manage roles.`)] });
    }

    try {
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember) return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} User not found in this server.`)] });

      if (targetMember.roles.highest.position >= moderator.roles.highest.position && guild.ownerId !== modUser.id) {
        return context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} You cannot mute someone with an equal or higher role.`)] });
      }

      // Find or create Muted role
      let muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      if (!muteRole) {
        if (context.isSlash) await context.defer();
        muteRole = await guild.roles.create({
          name: 'Muted',
          color: '#514f48',
          permissions: [],
          reason: 'Created Muted role for mute command'
        });
        
        // Apply to all channels
        guild.channels.cache.forEach(async (channel) => {
          await channel.permissionOverwrites.create(muteRole, {
            SendMessages: false,
            AddReactions: false,
            Connect: false
          }).catch(() => {});
        });
      }

      if (targetMember.roles.cache.has(muteRole.id)) {
        return context.isSlash ? context.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`${EMOJIS.WARNING} User is already muted.`)] }) : context.reply({ embeds: [new EmbedBuilder().setColor(COLORS.SAFFRON).setDescription(`${EMOJIS.WARNING} User is already muted.`)] });
      }

      await targetMember.roles.add(muteRole, reason);

      // DM User
      const dmEmbed = new EmbedBuilder()
        .setTitle(`You have been muted in ${guild.name}`)
        .setColor(COLORS.MAROON)
        .addFields({ name: 'Reason', value: reason });
      await dmUser(targetUser, dmEmbed);

      // Log
      await logModAction(guild, {
        moderatorId: modUser.id,
        targetId: targetUser.id,
        action: 'mute',
        reason,
        moderatorUser: modUser,
        targetUser: targetUser
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(COLORS.GREEN)
        .setDescription(`${EMOJIS.SUCCESS} Successfully muted **${targetUser.tag}**.\n**Reason:** ${reason}`);
        
      if (context.isSlash && interaction.deferred) {
        await context.editReply({ embeds: [confirmEmbed] });
      } else {
        await context.reply({ embeds: [confirmEmbed] });
      }

    } catch (error) {
      console.error('Mute error:', error);
      const errEmbed = new EmbedBuilder().setColor(COLORS.RED).setDescription(`${EMOJIS.ERROR} An error occurred while muting the user. Ensure my role is higher than the Muted role.`);
      return (context.isSlash && interaction.deferred) ? context.editReply({ embeds: [errEmbed] }) : context.reply({ embeds: [errEmbed] });
    }
  }
};
