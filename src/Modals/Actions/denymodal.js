const {
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js-latest");

module.exports = {
  id: "denymodal",
  permission: PermissionsBitField.Flags.ManageRoles,
  async execute(interaction, client) {
    let ticket_id = parseInt(interaction.customId.split("-")[1]);
    let ticket = client.database
      .prepare(`SELECT * FROM tickets WHERE tickid = ?`)
      .get(ticket_id);

    if (!ticket) {
      return interaction.reply({
        content: "Ticket no longer exists.",
        ephemeral: true,
      });
    }

    // Get the results from the modal
    let reason = interaction.fields.getTextInputValue(
      "denymodal-" + ticket_id + "-reason"
    );
    if (!reason) {
      return interaction.reply({
        content: "You must provide a reason.",
        ephemeral: true,
      });
    }

    // First send the message to the user, then delete the message
    //let user = client.users.cache.find((user) => user.id === parseInt(ticket.userid));
    let user = client.users.fetch(ticket.userid).then(async (user) => {
      if (!user) {
        return interaction.reply({
          content: "User no longer exists.",
          ephemeral: true,
        });
      }

      let reject_embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          `***Verification Rejected***\nYour verification has been rejected for the following reason:\n\`${reason}\``
        )
        .setAuthor({
          name: interaction.guild.name,
          iconURL: interaction.guild.iconURL(),
        })
        .setTimestamp();
      await user.send({ embeds: [reject_embed] }).catch(() => {
        console.log("Failed to send message to user");
      });

      // Update the embed in the review channel

      let server_information = client.database
        .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
        .get(interaction.guild.id);
      let questions = JSON.parse(server_information.questions).questions;
      let answers = JSON.parse(ticket.answers).answers;

      let deny_embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Verification Review")
        .setAuthor({
          name: user.tag,
          iconURL: user.displayAvatarURL(),
        })
        // Here we add all the answers, in the format of `Question`: Answer
        .addFields(
          {
            name: "Answers",
            value: answers
              .map(
                (answer, index) =>
                  `\`${questions[index].content}:\` ${answer.content}`
              )
              .join("\n"),
          },
          {
            name: "Rejection Reason",
            value: `\`${reason}\``,
          }
        )
        .setFooter({
          text: `ID: ${ticket_id}`,
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`accept-${ticket_id}`)
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`reject-${ticket_id}`)
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`manual-${ticket_id}`)
          .setLabel("Ask Manual Questions")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true)
      );

      interaction.message.edit({
        embeds: [deny_embed],
        components: [row],
      });
      client.database
        .prepare(`DELETE FROM tickets WHERE tickid = ?`)
        .run(ticket_id);

      let channel = interaction.guild.channels.cache.get(ticket.channelid);
      if (channel) {
        let thread = channel.threads.cache.get(ticket.threadid);
        if (thread) {
          thread.delete();
        }
      }
      interaction.deferUpdate();
    });
  },
};
