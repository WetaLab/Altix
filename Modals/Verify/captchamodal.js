const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  id: "captchamodal",
  async execute(interaction, client) {
    let captcha_correct = interaction.customId.split("-")[1];

    // Check if in thread verification
    let is_thread_verification = false;
    try {
      if (interaction.channel.isThread()) {
        let thread_title = interaction.channel.name;
        let thread_id = parseInt(thread_title.split("- ")[1]);
        let thread_information = client.database
          .prepare(`SELECT * FROM tickets WHERE tickid = ?`)
          .get(thread_id);
        if (thread_information) {
          is_thread_verification = true;
        }
      }
    } catch (error) {
      // It's not a thread
      is_thread_verification = false;
    }

    let answer = interaction.fields.getTextInputValue("captchamodal-answer");

    if (answer.toLowerCase() !== captcha_correct.toLowerCase()) {
      let incorrect_embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          `***Incorrect Answer***\nThe answer you provided was incorrect.`
        );

      return interaction.reply({
        embeds: [incorrect_embed],
        ephemeral: true,
      });
    }

    let server_information = client.database
      .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
      .get(interaction.guild.id.toString());

    if (!is_thread_verification) {
      let role = interaction.guild.roles.cache.find(
        (r) => r.name === server_information.role
      );
      if (!role || role !== undefined || role !== null) {
        await interaction.member.roles.add(role).then(() => {
          const Success = new EmbedBuilder()
            .setColor(0xffffff)
            .setDescription(`Verification was successful!`);
          return interaction.reply({ embeds: [Success], ephemeral: true });
        });
      } else {
        const Error = new EmbedBuilder()
          .setColor(0xffffff)
          .setTitle("Whoops!")
          .setDescription(
            `Uh oh! Seems like the verified role is missing\nYou might want to tell your local server administrators about this!`
          );
        return interaction.reply({ embeds: [Error], ephemeral: true });
      }
    } else {
      let ticket = client.database
        .prepare(`SELECT * FROM tickets WHERE tickid = ?`)
        .get(parseInt(interaction.channel.name.split("- ")[1]));
      if (!ticket) {
        return interaction.reply("Ticket not found");
      }
      let thread_title = interaction.channel.name;
      let questions = JSON.parse(server_information.questions).questions;
      let answers = JSON.parse(ticket.answers).answers;
      let thread_id = parseInt(thread_title.split("- ")[1]);
      client.database
        .prepare(
          `
UPDATE 
  tickets 
SET 
  active = 0 
WHERE 
  tickid = ?
`
        )
        .run(thread_id);
      interaction.guild.channels
        .fetch(server_information.channel)
        .then((channel) => {
          let review_embed = new EmbedBuilder()
            .setColor(0xffffff)
            .setTitle("Verification Review")
            .setAuthor({
              name: interaction.member.user.tag,
              iconURL: interaction.member.user.avatarURL(),
            })
            // Here we add all the answers, in the format of `Question`: Answer
            .addFields({
              name: "Answers",
              value: answers
                .map(
                  (answer, index) =>
                    `\`${questions[index].content}:\` ${answer.content}`
                )
                .join("\n"),
            })
            .setFooter({
              text: `ID: ${thread_id}`,
            });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`accept-${thread_id}`)
              .setLabel("Accept")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`reject-${thread_id}`)
              .setLabel("Reject")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`manual-${thread_id}`)
              .setLabel("Ask Manual Questions")
              .setStyle(ButtonStyle.Primary)
          );

          channel
            .send({ embeds: [review_embed], components: [row] })
            .then(() => {
              let Response = new EmbedBuilder()
                .setColor(0xffffff)
                .setDescription(
                  `**Your verification has been successfully submitted for review.**`
                )
                .setFooter({
                  text: `Please wait patiently for a moderator to review your verification.`,
                });
                interaction.channel.send({ embeds: [Response] });
                interaction.channel.setName(`Pending - ${thread_id}`);
            })
            .catch((error) => {
              console.log(error);
              let Response = new EmbedBuilder()
                .setColor(0xffa500)
                .setDescription(
                  `**There was an error submitting your verification.**`
                )
                .setFooter({
                  text: `Please try again later.`,
                });
                interaction.member.send({ embeds: [Response] });

              // Delete the ticket from the database so it can be re-opened
              client.database
                .prepare(
                  `
DELETE FROM 
  tickets 
WHERE 
  tickid = ?
`
                )
                .run(thread_id);
                interaction.channel.delete();
            });
        });
      return interaction.deferUpdate();
    }
  },
};
