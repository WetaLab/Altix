module.exports = {
  name: "interactionCreate",
  /**
  * @param {Client} client
  * @param {CommandInteraction} interaction
  **/

  async execute(interaction, client){
    if(interaction.isChatInputCommand()){
      await interaction.deferReply({ ephemeral: false }).catch(() => {});

      const command = client.commands.get(interaction.commandName);
      if (!command) return interaction.followUp({content: "This command no longer exists.", ephemeral: true}) && client.commands.delete(interaction.commandName);

      if (command.permission) {
        const member = interaction.member;
        if (member.permissions.has(command.permission)) {
          const Error = new MessageEmbed()
          .setColor('WHITE')
          .setTitle("Whoa there cowboy!")
          .setDescription(`You do not have permission to run this command!`)
          return interaction.editReply({embeds: [Error]})
        }
      }

      command.execute(client, interaction);
    }
  }
}