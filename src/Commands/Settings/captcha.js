const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "captcha",
  description: "Enable or disable the captcha system for verification",
  permission: PermissionsBitField.Flags.Administrator,
  ephemeral: true,
  options: [
    {
      name: "enable",
      description: "Enable the captcha system",
      type: 5,
      required: true,
    },
  ],

  async execute(client, interaction) {
    let enable = interaction.options.getBoolean("enable");
    if(enable){
        enable = 1;
    }else{
        enable = 0;
    }
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
  captcha = ? 
WHERE 
  guildid = ?
                `
        )
        .run(enable, interaction.guild.id.toString());

      let Response = new EmbedBuilder()
        .setColor(0xffffff)
        .setDescription(
          `The captcha system has been ${enable ? "enabled" : "disabled"}`
        );
      return interaction.followUp({
        embeds: [Response],
        ephemeral: true,
      });
    }
  },
};
