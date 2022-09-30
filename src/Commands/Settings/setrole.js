const { EmbedBuilder, PermissionsBitField } = require("discordjs-latest");

module.exports = {
    name: "setrole",
    description: "Sets the role that the bot will give to the user when they verify.",
    ephemeral: true,
    options: [
        {
            name: "role",
            description: "The role to give to the user when they verify.",
            required: true,
            type: 8,
        },
    ],
    permission: PermissionsBitField.Flags.Administrator,
    async execute(client, interaction) {
        let role = interaction.options.getRole("role");
        let server_information = client.database.prepare(`SELECT * FROM verifysettings WHERE guildid = ?`).get(interaction.guild.id.toString());
        if (!server_information) {
            let Error = new EmbedBuilder()
                .setColor(0xffffff)
                .setTitle("Something ain't right here!")
                .setDescription(
                    `There is no verification setup!\n Use /setup to create one`
                );
            return interaction.followUp({
                embeds: [Error],
                ephemeral: true,
            });
        }

        client.database.prepare(`UPDATE verifysettings SET role = ? WHERE guildid = ?`).run(role.name, interaction.guild.id.toString());
        let Response = new EmbedBuilder()
            .setColor(0xffffff)
            .setDescription(`The verification role has been set to \`${role.name}\``);
        return interaction.followUp({
            embeds: [Response],
            ephemeral: true,
        });
    }
}