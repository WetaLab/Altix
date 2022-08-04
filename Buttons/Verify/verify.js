/*
NOTE NOTE NOTE! The channel for reviewers to view
verification tickets is not required, therefore
we need to check if there is one, this goes for all
setting commands aswell.
*/

// This is called upon by the "Verify" button

const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// Generate random Ids for verification tickets
const random_id = () => {
  return Math.floor(Math.random() * 10000000000000);
};

const delete_thread_creation_message = (interaction) => {
  interaction.channel.messages.fetch({ limit: 1 }).then((messageMappings) => {
    let messages = Array.from(messageMappings.values());
    let previousMessage = messages[0];
    previousMessage.delete();
  });
};

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

    if (!server_information) {
      return interaction.reply({
        content: "This verification process no longer exists",
        ephemeral: true,
      });
    }

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
      let invalid_json = false;

      /* 
      In the case that the server has an valid question object, but it's
      empty, we have to check that
      */

      if (server_information.questions !== "") {
        try {
          let JSON_data = JSON.parse(server_information.questions);
          if (JSON_data.questions.length == 0) {
            invalid_json = true;
          }
        } catch (e) {
          invalid_json = true;
        }
      }

      if (
        server_information.channel !== -1 &&
        server_information.questions !== "" &&
        invalid_json !== true
      ) {
        // Handle thread verification

        // Check if there already is a thread for this user
        let thread = client.database
          .prepare(
            `
SELECT tickid
FROM   tickets
WHERE  userid = ?
       AND guildid = ? 
            `
          )
          .get(interaction.member.id, interaction.guild.id);

        if (!thread) {
          let JSON_object = {
            answers: [],
          };

          const generated_id = random_id();

          client.database
            .prepare(
              `
INSERT INTO tickets(tickid, userid, answers, guildid, active) 
VALUES 
  (?, ?, ?, ?, ?)
        `
            )
            .run(
              generated_id,
              interaction.member.id,
              JSON.stringify(JSON_object),
              interaction.guild.id,
              0
            );

          const thread = await interaction.channel.threads
            .create({
              name: "Verification Thread - " + generated_id,
              autoArchiveDuration: 60,
              reason: "Verification Thread",
            })
            .then((thread) => {
              // Delete the "someone started a new thread" message
              setTimeout(delete_thread_creation_message, 100, interaction);

              let JSON_object = JSON.parse(server_information.questions);
              let thread_embed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setTitle(interaction.guild.name + "'s Verification Ticket")
                .setDescription(
                  `Please answer the following ${JSON_object.questions.length} questions to verify yourself`
                )
                .setFooter({ text: `ID: ${generated_id}` });

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`proceed-${generated_id}`)
                  .setLabel("Proceed")
                  .setStyle(ButtonStyle.Success)
              );

              thread.send({
                embeds: [thread_embed],
                components: [row],
                content: interaction.member.toString(),
              });

              interaction.reply({
                content: `A verification ticket has been created, ${thread.toString()}`,
                ephemeral: true,
              });

              //thread.members.add(interaction);
            });
        } else {
          return interaction.reply({
            content: "You already have an open verification ticket.",
            ephemeral: true,
          });
        }
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
