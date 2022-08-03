/*
NOTE NOTE NOTE! The channel for reviewers to view
verification tickets is not required, therefore
we need to check if there is one, this goes for all
setting commands aswell.
*/

// This is called upon by the "Verify" button

module.exports = {
  id: "verifybutton",
  async execute(interaction, client) {
    /*interaction.reply({
      content: "This is the point of which this bot would start your verification process",
      ephemeral: true
    })*/
    let fetched_role = client.database
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
      .get(interaction.guild.id).role;

    interaction.reply({
      content: fetched_role,
      ephemeral: true,
    });
  },
};
