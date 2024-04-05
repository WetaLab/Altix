const { PermissionsBitField, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discordjs-latest");

module.exports = {
  id: "reject",
  ephemeral: true,
  permission: PermissionsBitField.Flags.ManageRoles,
  defer: false,
  async execute(interaction, client) {
    let ticket_id = parseInt(interaction.customId.split("-")[1]);
    let ticket = client.database
      .prepare(`SELECT * FROM tickets WHERE tickid = ?`)
      .get(ticket_id);

    if (!ticket) {
      return interaction.followUp({
        content: "Ticket no longer exists.",
        ephemeral: true,
      });
    }

    // Create the modal
    let modal = new ModalBuilder()
        .setCustomId(`denymodal-${ticket_id}`)
        .setTitle("Reject Ticket")
    
    // Create the text input
    const textInput = new TextInputBuilder()
        .setCustomId(`denymodal-${ticket_id}-reason`)
        .setLabel("Reason")
        .setStyle(TextInputStyle.Paragraph)
    
    const row = new ActionRowBuilder().addComponents(textInput);

    modal.addComponents(row);
    await interaction.showModal(modal).catch(() => {})
    // interaction.deferUpdate().catch(() => {});
  },
};
