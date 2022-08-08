const { EmbedBuilder, PermissionsBitField } = require("discord.js");
module.exports = {
  name: "interactionCreate",
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   **/

  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (command) {
        if (command.permission) {
          const member = interaction.member;
          if (
            !member.permissions ||
            !member.permissions.has(command.permission)
          ) {
            const Error = new EmbedBuilder()
              .setColor(0xffffff)
              .setTitle("Whoa there cowboy!")
              .setDescription(
                `You do not have permission to run this command!`
              );
            return interaction.reply({ embeds: [Error], ephemeral: true });
          }
        }

        if (command.ephemeral) {
          await interaction.deferReply({ ephemeral: true }).catch(() => {});
        } else {
          await interaction.deferReply({ ephemeral: false }).catch(() => {});
        }
      }

      if (!command)
        return (
          interaction.reply({
            content: "This command no longer exists.",
            ephemeral: true,
          }) && client.commands.delete(interaction.commandName)
        );

      command.execute(client, interaction).catch((error) => {
        console.log(error);
        if (command.rollback) {
          command.rollback(client, interaction, error);
        } else {
          interaction.reply({
            content: "A critical error has occured while running this action.",
            ephemeral: true,
          });
        }
      });
    }
  },
};
