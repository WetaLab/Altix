const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  id: "accept",
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

    let user = client.users.cache.find((user) => user.id === ticket.userid);

    if (
      !interaction.guild.members.me.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      const Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(
          `I don't seem to have the proper access to verify this user`
        );
      return interaction.reply({ embeds: [Error], ephemeral: true });
    }

    if (!user) {
      return interaction.reply({
        content: "User no longer exists.",
        ephemeral: true,
      });
    }

    let accept_embed = new EmbedBuilder()
      .setColor(0x00ff00)
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
      embeds: [accept_embed],
      components: [row],
    });

    client.database
      .prepare(`DELETE FROM tickets WHERE tickid = ?`)
      .run(ticket_id);

    // Archive the thread
    let channel = interaction.guild.channels.cache.get(ticket.channelid);
    if (channel) {
      let thread = channel.threads.cache.get(ticket.threadid);
      if (thread) {
        thread.delete();
      }
    }

    let role = interaction.guild.roles.cache.find(
      (r) => r.name === server_information.role
    );
    if (!role || role !== undefined || role !== null) {
      let user_member = interaction.guild.members.cache.get(user.id);
      await user_member.roles.add(role).then(() => {
        let accept_embed = new EmbedBuilder()
          .setColor(0xffffff)
          .setDescription(`***Your verification has been accepted!***`)
          .setAuthor({
            name: interaction.guild.name,
            iconURL: interaction.guild.iconURL(),
          })
          .setTimestamp();

        user.send({ embeds: [accept_embed] }).catch(() => {
          console.log("Failed to send verification accept message to user");
        });
        interaction.deferUpdate();
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
  },
};
