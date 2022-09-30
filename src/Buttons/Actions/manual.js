const {
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discordjs-latest");

module.exports = {
  id: "manual",
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

    let server_information = client.database
      .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
      .get(interaction.guild.id);
    let questions = JSON.parse(server_information.questions).questions;
    let answers = JSON.parse(ticket.answers).answers;

    // Add the moderator to the ticket & thread
    let user = client.users.fetch(ticket.userid).then(async (user) => {
      if (!user) {
        return interaction.reply({
          content: "User no longer exists.",
          ephemeral: true,
        });
      }

      client.database
        .prepare(`UPDATE tickets SET moderatorid = ? WHERE tickid = ?`)
        .run(interaction.member.id.toString(), ticket_id);

      let channel = interaction.guild.channels.cache.get(ticket.channelid);

      if (channel) {
        let thread = channel.threads.cache.get(ticket.threadid);
        if (thread) {
          let moderator_embed = new EmbedBuilder()
            .setColor(0xffffff)
            .setDescription(
              `**You provided too little information.**\nA moderator will soon be with you to ask additional questions.`
            );

          await thread.send({ embeds: [moderator_embed] }).catch(() => {});
          // Lock manual button here
          let manual_embed = new EmbedBuilder()
            .setColor(0xffffff)
            .setTitle("Verification Review")
            .setAuthor({
              name: user.tag,
              iconURL: user.displayAvatarURL(),
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
              text: `ID: ${ticket_id}`,
            });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`accept-${ticket_id}`)
              .setLabel("Accept")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`reject-${ticket_id}`)
              .setLabel("Reject")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`manual-${ticket_id}`)
              .setLabel("Ask Manual Questions")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
          );

          interaction.message.edit({
            embeds: [manual_embed],
            components: [row],
          });
          thread.members.add(interaction.member.id);

          await interaction.deferReply({ephemeral: true});
          interaction.followUp({
            content: "You have been added to the thread. " + thread.toString(),
            ephemeral: true,
          });
        } else {
          return interaction.reply({
            content: "Thread no longer exists.",
            ephemeral: true,
          });
        }
      }
    });
  },
};
