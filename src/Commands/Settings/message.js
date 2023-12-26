const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discordjs-latest");

module.exports = {
  name: "message",
  description: "Sets specified message content at specific verification stage",
  permission: PermissionsBitField.Flags.Administrator,
  options: [
    {
      name: "selection",
      description: "The message you want to edit",
      type: 3,
      required: true,
      choices: [
        {
          name: "Verification accepted",
          value: "accepted",
        },
        {
          name: "Initial message",
          value: "init",
        },
      ],
    },
    {
      name: "content",
      description:
        "The message content that will be displayed by the bot. (Use /n for new lines)",
      type: 3,
      required: true,
    },
  ],

  async execute(client, interaction) {
    const regex_to_replace = new RegExp("/n", "g");

    const custom_content = interaction.options
      .getString("content")
      .replace(regex_to_replace, "\n");

    const selection = interaction.options.get("selection");

    let server_information = client.database
      .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
      .get(interaction.guild.id.toString());
    if (!server_information) {
      let Error = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          "<a:warning1:890012010224431144> | An error has occured"
        )
        .setFooter({
          text: `There is no verification setup!\n Use /setup to create one`,
        });
      return interaction.followUp({
        embeds: [Error],
        ephemeral: true,
      });
    }

    client.database                       // This is iffy
      .prepare(`UPDATE verifysettings SET ${selection.value} = ? WHERE guildid = ?`)
      .run(custom_content, interaction.guild.id.toString());
    let Response = new EmbedBuilder()
      .setColor(0xffffff)
      .setDescription(
        `<a:success:884527566688509982> | The \`${selection.value}\` message has been updated!`
      );
    return interaction.followUp({
      embeds: [Response],
      ephemeral: true,
    });
  },
};
