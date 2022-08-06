const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "addquestion",
  description: "Add a new question to an existing verification process",
  permission: PermissionsBitField.Flags.Administrator,
  ephemeral: true,
  options: [
    {
      name: "question",
      description:
        "The new question that you want to be added. (Use /n for new lines)",
      type: 3,
      required: true,
    },
    {
      name: "specifics",
      description: "Extra details about the question. (Use /n for new lines)",
      type: 3,
      required: false,
    },
  ],

  async execute(client, interaction) {
    const regex_to_replace = new RegExp("/n", "g");

    const question = interaction.options.getString("question").replace(regex_to_replace, "\n");
    let specifics = interaction.options.getString("specifics")
    if (!specifics) {
      specifics = "";
    }else{
      specifics = specifics.replace(regex_to_replace, "\n");
    }

    // First, we check if there is a valid review channel
    let review_channel = client.database
      .prepare(
        `
SELECT 
  channel 
FROM 
  verifysettings 
WHERE 
  guildid = ?`
      )
      .get(interaction.guild.id.toString()).channel;
      review_channel = parseInt(review_channel);

    if (
      review_channel !== -1 &&
      !interaction.guild.channels.cache.get(review_channel)
    ) {
      let server_information = client.database
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
        .get(interaction.guild.id.toString());

      if (server_information.questions !== "") {
        let JSON_object = JSON.parse(server_information.questions);

        JSON_object.questions.push({
          content: question,
          specifics: specifics,
        });

        JSON_object = JSON.stringify(JSON_object);
        client.database
          .prepare(
            `
UPDATE 
  verifysettings 
SET 
  questions = ? 
WHERE 
  guildid = ?
      `
          )
          .run(JSON_object, interaction.guild.id.toString());

        let Response = new EmbedBuilder()
          .setColor(0xffffff)
          .setDescription(
            `Sucessfully added new question to the verification process.`
          );
        return interaction.followUp({
          embeds: [Response],
          ephemeral: true,
        });
      } else {
        // Create new JSON questions object
        let JSON_object = {
          questions: [
            {
              content: question,
              specifics: specifics,
            },
          ],
        };
        JSON_object = JSON.stringify(JSON_object);

        client.database
          .prepare(
            `
UPDATE 
  verifysettings 
SET 
  questions = ? 
WHERE 
  guildid = ?
      `
          )
          .run(JSON_object, interaction.guild.id.toString());

        let Response = new EmbedBuilder()
          .setColor(0xffffff)
          .setDescription(
            `Sucessfully added new question to the verification process.`
          );
        return interaction.followUp({
          embeds: [Response],
          ephemeral: true,
        });
      }
    } else {
      let Response = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(
          `The reviewer channel is either not set, or doesn't exist!`
        );
      return interaction.followUp({
        embeds: [Response],
        ephemeral: true,
      });
    }
  },
};
