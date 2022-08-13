const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { sanitize_string } = require("../../lib/utils.js"); // Load the utils library


module.exports = {
  name: "editquestion",
  permission: PermissionsBitField.Flags.Administrator,
  description: "Edit an existing question in an existing verification process",
  ephemeral: true,
  options: [
    {
      name: "id",
      description: "The question to be set (the number of the question)",
      required: true,
      type: 4,
    },
    {
      name: "question",
      description: "The new question (use /n to create a new line)",
      required: true,
      type: 3,
    },
    {
      name: "specifics",
      description:
        "Extra details about the question. (Use /n to create a new line)",
      required: false,
      type: 3,
    },
  ],
  async execute(client, interaction) {
    const regex_to_replace = new RegExp("/n", "g");

    let question = interaction.options.getInteger("id");
    const question_text = sanitize_string(interaction.options.getString("question").replace(regex_to_replace, "\n"));
    let specifics = interaction.options.getString("specifics");

    if(!specifics) {
        specifics = "";
    }else{
        specifics = sanitize_string(specifics.replace(regex_to_replace, "\n"));
    }

    let server_information = client.database
      .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
      .get(interaction.guild.id.toString());
    if (!server_information) {
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
    }
    if (
      question > JSON.parse(server_information.questions).questions.length ||
      question <= 0
    ) {
      let Response = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(`The question number you entered does not exist!`);
      return interaction.followUp({
        embeds: [Response],
        ephemeral: true,
      });
    }
    // Update the question
    let JSON_object = JSON.parse(server_information.questions);
    JSON_object.questions[question - 1].content = question_text;
    JSON_object.questions[question - 1].specifics = specifics;
    client.database
        .prepare(
            `UPDATE verifysettings SET questions = ? WHERE guildid = ?`
        ).run(JSON.stringify(JSON_object), interaction.guild.id.toString());
    let Response = new EmbedBuilder()
        .setColor(0xffffff)
        .setDescription(`Question \`${question}\` has been updated!`);
    return interaction.followUp({
        embeds: [Response],
        ephemeral: true,
    });
  },
};
