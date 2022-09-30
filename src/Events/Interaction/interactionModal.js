const {
  ButtonInteraction,
  EmbedBuilder,
  InteractionType,
} = require("discordjs-latest");

module.exports = {
  name: "interactionCreate",
  /**
   * @param {Client} client
   * @param {ModalInteraction} interaction
   **/

  async execute(interaction, client) {
    if (interaction.type !== InteractionType.ModalSubmit) return;

    const Modal = client.modals.get(interaction.customId.split("-")[0]);
    if (!Modal) return;

    if (
      Modal.permission &&
      !interaction.member.permissions.has(Modal.permission)
    ) {
      const Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Whoa there cowboy!")
        .setDescription(`You don't have permission to do that!`);
      return interaction.reply({ embeds: [Error], ephemeral: true });
    }

    /*if (
      Button.ownerOnly &&
      interaction.member.id !== interaction.guild.ownerId
    ) {
      const Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Hm, something isn't quite right!")
        .setDescription(`You're not the owner of the server!`);
      return interaction.reply({ embeds: [Error], ephemeral: true });
    }*/
    // Option not needed


    try {
      await Modal.execute(interaction, client);
    } catch (error) {
      console.log(error);
      if (Modal.rollback) {
        Modal.rollback(client, interaction, error);
      } else {
        interaction.reply({
          content: "A critical error has occured while running this action.",
          ephemeral: true,
        });
      }
    }
  },
};
