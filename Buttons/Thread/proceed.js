const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  id: "proceed",
  async execute(interaction, client) {
    let ticket_id = parseInt(interaction.customId.split("-")[1]);
    let ticket = client.database
      .prepare(`SELECT * FROM tickets WHERE tickid = ?`)
      .get(ticket_id);

    if (!ticket) {
      return interaction.reply({
        content: "Ticket not valid!",
        ephemeral: true,
      });
    }

    if (!ticket.userid == interaction.member.id) {
      return interaction.reply({
        content: "You are not the owner of this ticket!",
        ephemeral: true,
      });
    }

    if (!ticket.active == 0) {
      return interaction.reply({
        content: "You're already in an active session!",
        ephemeral: true,
      });
    }

    let server_information = client.database
      .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
      .get(interaction.guild.id.toString());

    let questions = JSON.parse(server_information.questions).questions;

    /*let thread_embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle(interaction.guild.name + "'s Verification Ticket")
      .setDescription(
        `Please answer the following ${questions.length} questions to verify yourself`
      )
      .setFooter({ text: `ID: ${ticket_id}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`proceed-${ticket_id}`)
        .setLabel("Proceed")
        .setDisabled(true)
        .setStyle(ButtonStyle.Success)
    );

    interaction.editReply({
      embeds: [thread_embed],
      components: [row],
      content: interaction.member.toString(),
    });*/

    /*
    Perhaps use this to delete the last sent message from the bot and then send the message
    Above

    interaction.channel.messages.cache.filter(m => thebotid === 'user id')
    */

    //let ticket_information = client.database.prepare(``)

    // Send the first question to the user, the rest will be handled by messageCreate.js

    let specifics = "";
    if (server_information.specifics != "") {
      specifics = `\n\`${questions[0].specifics}\``;
    }

    let question_embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle(`Question 1/${questions.length}`)
      .setDescription("> ***" + questions[0].content + "***" + specifics);

    await interaction.channel
      .send({
        embeds: [question_embed],
      })
      .then(() => {
        interaction.deferUpdate();
        client.database
          .prepare(`UPDATE tickets SET active = 1 WHERE tickid = ?`)
          .run(ticket_id);
      });
  },
};
