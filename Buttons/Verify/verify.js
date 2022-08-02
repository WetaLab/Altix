module.exports = {
  id: "verify-button",
  async execute(interaction){
    interaction.reply({
      content: "This is the point of which this bot would start your verification process",
      ephemeral: true
    })
  }
}