/*
NOTE NOTE NOTE! The channel for reviewers to view
verification tickets is not required, therefore
we need to check if there is one, this goes for all
setting commands aswell.
*/

// This is called upon by the "Verify" button

const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  id: "verifybutton",
  async execute(interaction, client) {
    /*interaction.reply({
      content: "This is the point of which this bot would start your verification process",
      ephemeral: true
    })*/
    let server_information = client.database
      .prepare(
        `
SELECT 
  * 
FROM 
  verifysettings 
WHERE 
  guildid = ?
    `
      )
      .get(interaction.guild.id);

    // Prepare verification process
    if (
      !interaction.member.roles.cache.some(
        (r) => r.name === server_information.role
      )
    ) {
      // Check permission first
      if (
        !interaction.guild.members.me.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        const Error = new EmbedBuilder()
          .setColor(0xffffff)
          .setTitle("Something ain't right here!")
          .setDescription(
            `I don't seem to have the proper access to verify you`
          );
        return interaction.reply({ embeds: [Error], ephemeral: true });
      }

      // Check if the thread verification system is needed
      if (
        server_information.channel !== -1 &&
        server_information.questions !== ""
      ) {
        // Handle threads
      } else {
        // Thread question system has not been setup
        let role = interaction.guild.roles.cache.find(
          (r) => r.name === server_information.role
        );
        if (!role || role !== undefined || role !== null) {
          await interaction.member.roles.add(role).then(() => {
            const Success = new EmbedBuilder()
              .setColor(0xffffff)
              .setDescription(`Verification was successful!`);
            return interaction.reply({ embeds: [Success], ephemeral: true });
          });
        } else {
          const Error = new EmbedBuilder()
            .setColor(0xffffff)
            .setTitle("Whoops!")
            .setDescription(
              `Uh oh! Seems like the verified role is missing\nYou might want to tell your local server administrators about this!`
            );
          return interaction.reply({ embeds: [Error], ephemeral: true });
        }
      }
    } else {
      const Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(`You've already been verified!`);
      return interaction.reply({ embeds: [Error], ephemeral: true });
    }
  },
};
