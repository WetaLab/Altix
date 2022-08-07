const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "removequestion",
  description: "Remove a question from the verification process.",
  permission: PermissionsBitField.Flags.Administrator,
  ephemeral: true,
  options: [
    {
      name: "question",
      description: "Question number to remove.",
      required: true,
      type: 4,
    },
  ],
  async execute(client, interaction) {
    let question = interaction.options.getInteger("question");
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
    let review_channel = interaction.guild.channels
      .fetch(server_information.channel)
      .catch(() => {
        review_channel = null;
      })
      .then((review_channel) => {
        if (!review_channel) {
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
        if (question > JSON.parse(server_information.questions).questions.length || question <= 0) {
          let Response = new EmbedBuilder()
            .setColor(0xffffff)
            .setTitle("Something ain't right here!")
            .setDescription(`The question number you entered does not exist!`);
          return interaction.followUp({
            embeds: [Response],
            ephemeral: true,
          });
        }

        let JSON_object;
        try {
          JSON_object = JSON.parse(server_information.questions);
          JSON_object.questions.splice(question - 1, 1);
          JSON_object = JSON.stringify(JSON_object);
        } catch (e) {
          let Response = new EmbedBuilder()
            .setColor(0xffffff)
            .setTitle("Something went wrong!")
            .setDescription(
              `We were unable to remove the question due to an error.`
            );
          return interaction.followUp({
            embeds: [Response],
            ephemeral: true,
          });
        }
        client.database
          .prepare(`UPDATE verifysettings SET questions = ? WHERE guildid = ?`)
          .run(JSON_object, interaction.guild.id.toString());
        let Response = new EmbedBuilder()
          .setColor(0xffffff)
          .setDescription(
            `Sucessfully removed question \`${question}\` from the verification process.`
          );
        return interaction.followUp({
          embeds: [Response],
          ephemeral: true,
        });
      });
  },
};
