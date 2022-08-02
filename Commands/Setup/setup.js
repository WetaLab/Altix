/*
NOTE NOTE NOTE! If no verification questions have been set
by the server administrators, it should work like all other
bots, giving the verified role simply by pressing the "verify"
button.
*/

const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: "setup",
  description: "Create a new verification process",
  permission: PermissionsBitField.Flags.Administrator,
  options: [
    {
      name: "content",
      description: "The message that will be displayed by the bot",
      type: 3,
      required: true,
    },
    {
      name: "channel",
      description: "Channel for reviewers to accept verifications",
      type: 7,
      required: true,
    },
    {
      name: 'role',
      description: "The role to be given once verified",
      type: 8,
      required: true,
    },
  ],
  async execute(client, interaction) {
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");
    const custom_content = interaction.options.getString("content");
    console.log(custom_content);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('verify-button')
          .setLabel('Verify')
          .setStyle(ButtonStyle.Success),
      );

    const Response = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle(`${interaction.guild.name} Verification`)
      .setDescription(custom_content);
    interaction.followUp(
      {
        embeds: [Response],
        components: [row],
      }
    );

  }
}
