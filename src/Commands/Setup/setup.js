/*
NOTE NOTE NOTE! If no verification questions have been set
by the server administrators, it should work like all other
bots, giving the verified role simply by pressing the "verify"
button.
*/

const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discordjs-latest");

module.exports = {
  name: "setup",
  description: "Create a new verification process",
  permission: PermissionsBitField.Flags.Administrator,
  options: [
    {
      name: "content",
      description:
        "The message content that will be displayed by the bot. (Use /n for new lines)",
      type: 3,
      required: true,
    },
    {
      name: "role",
      description: "The role to be given once verified",
      type: 8,
      required: true,
    },
  ],

  async execute(client, interaction) {
    console.log(interaction.channel.isThread());
    if (interaction.channel.isThread()) {
      let Error = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          "<a:warning1:890012010224431144> | An error has occured"
        )
        .setFooter({
          text: `You can't use this command in a thread!`,
        });
      return interaction.followUp({
        embeds: [Error],
        ephemeral: true,
      });
    }
    let channel;
    channel = {
      id: -1,
    };
    const role = interaction.options.getRole("role");
    const custom_content = interaction.options.getString("content");

    let database_operation = 0; // 0 = Add to, 1 == update

    // Check if already exists etc etc
    let does_exist = client.database
      .prepare(
        `
SELECT 
  * 
FROM 
  verifysettings 
WHERE 
  guildid = ?
    `
      )
      .get(interaction.guild.id);
    if (does_exist !== null && does_exist !== undefined) {
      database_operation = 1;
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verifybutton")
        .setLabel("Verify")
        .setStyle(ButtonStyle.Success)
    );

    const regex_to_replace = new RegExp("/n", "g");

    const Response = {
      color: 0x2f3136,
      title: `${interaction.guild.name} Verification`,
      description: custom_content.replace(regex_to_replace, "\n"),
    };
    let sent_reply = await interaction
      .followUp({
        embeds: [Response],
        components: [row],
      })
      .then((sent) => {
        // Add to database
        if (database_operation == 0) {
          client.database
            .prepare(
              `
INSERT INTO verifysettings(guildid, questions, channel, role) 
VALUES 
  (?, ?, ?, ?)
    `
            )
            .run(
              interaction.guild.id.toString(),
              "",
              channel.id.toString(),
              role.name
            );
        } else {
          client.database
            .prepare(
              `
UPDATE 
  verifysettings 
SET 
  role = ?, 
  channel = ? 
WHERE 
  guildid = ?
        `
            )
            .run(
              role.name,
              channel.id.toString(),
              interaction.guild.id.toString()
            );
        }
      });
  },
};
