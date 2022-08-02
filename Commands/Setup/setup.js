const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: "setup",
    description: "Create a new verification process",
    permission: "ADMINISTRATOR",
    execute(client, interaction) {
        const Response = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle("Setting up a storm!")
        .setDescription("*Setup the bot to your needs, when you're done, press Done*");
        interaction.followUp({embeds: [Response]});
    }
}