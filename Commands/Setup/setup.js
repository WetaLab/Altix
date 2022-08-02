/*
NOTE NOTE NOTE! If no verification questions have been set
by the server administrators, it should work like all other
bots, giving the verified role simply by pressing the "verify"
button.
*/

const { EmbedBuilder, PermissionsBitField } = require('discord.js');
module.exports = {
    name: "setup",
    description: "Create a new verification process",
    permission: PermissionsBitField.Flags.Administrator,
    execute(client, interaction) {
        const Response = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle("Setting up a storm!")
        .setDescription("*Setup the bot to your needs, when you're done, press Done*");
        interaction.followUp({embeds: [Response]});
    }
}