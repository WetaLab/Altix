const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  id: "proceed",
  ownerOnly: true,
  async execute(interaction, client) {
    /*
    interaction.editReply({ content: 'A button was clicked!', components: [] });
    let ticket_id = parseInt(interaction.customId.split("-")[1]);
    let ticket = client.database.prepare(`SELECT * FROM tickets WHERE tickid = ?`).get(ticket_id);
    //let ticket_information = client.database.prepare(``)*/
  }
}