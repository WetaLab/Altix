const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discordjs-latest");

module.exports = {
  id: "accept",
  permission: PermissionsBitField.Flags.ManageRoles,

  async rollback(client, interaction, error) {
    /* 
      NOTE NOTE NOTE!
      This is a real "oh fuck" moment if called, because the ticket
      has most likely been deleted, and cannot be rolled back.
  
      The best solution would be to have some kind of "undo" system,
      but that's a bit of a pain to implement, so instead we just
      message reviewer that something went wrong.
      (We can't message the user because we don't know their ID)
    */

    // Edit the message to say something went wrong

    if (!interaction.message) {
      if (error.code == 50013) {
        let error_embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setDescription(
            "<a:warning1:890012010224431144> | An error has occured"
          )
          .setFooter({
            text: "I do not have the permission to give the verified role to the user.\nPlease grant me the correct permissions.",
          });
        return interaction.reply({
          embeds: [error_embed],
          ephemeral: true,
        });
      } else {
        let error_embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setDescription(
            "<a:warning1:890012010224431144> | An error has occured"
          )
          .setFooter({
            text: "Please report this issue to Static#4371 if the issue persists.",
          });

        // add some sort of error tracing/report for debug purposes

        return interaction.reply({
          embeds: [error_embed],
          ephemeral: true,
        });
      }
    }

    let message_embed_raw = interaction.message.embeds[0].data;
    let message_embed = {
      title: message_embed_raw.title,
      footer: message_embed_raw.footer,
      fields: message_embed_raw.fields,
      color: 0xffa500,
      author: {
        name: message_embed_raw.author.name,
        icon_url: message_embed_raw.author.icon_url,
      },
    };

    // Add to existing fields because we no longer have answers/questions
    // Check if the error is missing permissions
    if (error.code == 50013) {
      message_embed.fields.push({
        name: "A serious error has occured",
        value:
          "I do not have the permission to give the verified role to the user.\nPlease grant me the permission.",
      });
    } else {
      console.log(error);
      message_embed.push({
        name: "A serious error has occured",
        value: "Please report this issue to Static#4371 if the issue persists.",
      });
    }

    // Lock buttons just in case
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setLabel("Accept")
        .setCustomId("accept-fail")
        .setDisabled(true),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel("Reject")
        .setCustomId("reject-fail")
        .setDisabled(true),
      new ButtonBuilder()
        .setLabel("Ask Manual Questions")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("manual-fail")
        .setDisabled(true)
    );

    await interaction.message.edit({
      embeds: [message_embed],
      components: [row],
    });

    interaction.deferUpdate();

    // Check if ticket is still in the database, if so delete it
    const ticket = client.database
      .prepare("SELECT * FROM tickets WHERE tickid = ?")
      .get(interaction.message.embeds[0].footer.text.split(": ")[1]);
    if (ticket) {
      client.database
        .prepare(`DELETE FROM tickets WHERE tickid = ?`)
        .run(ticket.tickid);
    }
  },

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

    let user = client.users.fetch(ticket.userid).then(async (user) => {
      if (
        !interaction.guild.members.me.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        const Error = new EmbedBuilder()
          .setColor(0xffa500)
          .setDescription(
            "<a:warning1:890012010224431144> | An error has occured"
          )
          .setFooter({
            text: "I don't seem to have the proper access to verify this user.",
          });
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
        await user_member.roles
          .add(role)
          .then(() => {
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
          })
          .catch(async (error) => {
            this.rollback(client, interaction, error);
          });
      } else {
        const Error = new EmbedBuilder()
          .setColor(0xffa500)
          .setDescription("<a:warning1:890012010224431144> | An error has occured")
          .setFooter({
            text: `Uh oh! Seems like the verified role is missing\nYou might want to tell your local server administrators about this!`
          });
        return interaction.reply({ embeds: [Error], ephemeral: true });
      }
    });
  },
};
