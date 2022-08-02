const { MessageEmbed } = require('discord.js');
module.exports = {
    name: "setup",
    description: "Create a new verification process",
    permission: "ADMINISTRATOR",
    execute(client, interaction) {
        const Response = new MessageEmbed()
        .setColor('WHITE')
        .setTitle("Setting up a storm!")
        .setDescription("*Setup the bot to your needs, when you're done, press Done*");
        interaction.followUp({embeds: [Response]});
    }
}