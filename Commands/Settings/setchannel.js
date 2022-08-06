const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "setchannel",
  description: "Set the verification review channel for the server",
  permission: PermissionsBitField.Flags.Administrator,
  ephemeral: true,
  options: [
    {
      name: "channel",
      description: "The channel to be set as verification review channel",
      type: 7,
      required: true,
    },
  ],

  async execute(client, interaction) {
    const channel = interaction.options.getChannel("channel");
    // Make sure that there is an verification entry
    let database_response = client.database
      .prepare(
        `
SELECT 
  * 
FROM 
  verifysettings 
WHERE 
  guildid = ?`
      )
      .get(interaction.guild.id.toString());

    if (!database_response) {
      let Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(
          `There is no verification setup!\n Use /setup to create one`
        );
      return interaction.followUp({
        embeds: [Error],
        ephemeral: true,
      });
    } else {
      // Update database
      client.database
        .prepare(
          `
UPDATE 
  verifysettings 
SET 
  channel = ? 
WHERE 
  guildid = ?
      `
        )
        .run(channel.id.toString(), interaction.guild.id.toString());
      
      let Response = new EmbedBuilder()
        .setColor(0xffffff)
        .setDescription(
          `Verification review channel has sucessfully been updated.`
        );
      return interaction.followUp({
        embeds: [Response],
        ephemeral: true,
      });
    }
  },
};
