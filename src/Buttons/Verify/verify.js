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
  ChannelType,
  Embed,
  AttachmentBuilder
} = require("discordjs-latest");

const { writeFileSync, unlinkSync } = require("fs");
const { Captcha } = require("captcha-canvas");

const { invalidate_captcha } = require("../../lib/utils.js"); // Load the utils library

// Generate random Ids for verification tickets
const random_id = () => {
  return Math.floor(Math.random() * 10000000000000);
};

module.exports = {
  id: "verifybutton",
  ephemeral: true,
  defer: true,
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
      .get(interaction.guild.id.toString());

    if (!server_information) {
      return interaction.followUp({
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
          .setColor(0xffa500)
          .setDescription(
            "<a:warning1:890012010224431144> | An error has occured"
          )
          .setFooter({
            text: `I don't seem to have the proper access to verify you`,
          });
        return interaction.followUp({ embeds: [Error], ephemeral: true });
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
        let ticket = client.database
          .prepare(
            `
SELECT *
FROM   tickets
WHERE  userid = ?
       AND guildid = ? 
            `
          )
          .get(
            interaction.member.id.toString(),
            interaction.guild.id.toString()
          );

        // Check if there is a ticket, and if so, does the ticket have a functional channel
        if (ticket) {
          let channel = interaction.guild.channels.cache.get(ticket.channelid);
          if (channel) {
            let thread = channel.threads.cache.get(ticket.threadid);
            if (!thread) {
              client.database
                .prepare(
                  `
DELETE
FROM  tickets
WHERE tickid = ?
                  `
                )
                .run(ticket.tickid);

              client.database
                .prepare(
                  `
                DELETE FROM captcha WHERE userid = ? AND guildid = ?`
                )
                .run(
                  interaction.member.id.toString(),
                  interaction.guild.id.toString()
                );

              ticket = null;
            }
          }

          if (ticket !== null) {
            // At this point, this "get thread" should just be turned into a function
            let channel = interaction.guild.channels.cache.get(
              ticket.channelid
            );
            let additional_information = ""; // Store this as an empty string for in-case of scenario

            // We don't need to run any checks as it has already been done

            let thread = channel.threads.cache.get(ticket.threadid);
            if (thread) {
              additional_information = thread.toString();
            }

            return interaction.followUp({
              content: `You already have an open verification ticket. ${additional_information}`,
              ephemeral: true,
            });
          }
        }

        // Is the review channel existant?
        if (
          server_information.channel &&
          interaction.guild.channels.cache.get(server_information.channel)
        ) {
          // All good
        } else {
          // New embed format style standard?
          let non_existant_channel_error = new EmbedBuilder()
            .setColor(0xffa500)
            .setDescription(
              "<a:warning1:890012010224431144> | An error has occured"
            )
            .setFooter({
              text: "You can't send verification tickets to the void! The review channel doesn't exist, ask a server administrator to run /setchannel",
            });

          return interaction.followUp({
            embeds: [non_existant_channel_error],
            ephemeral: true,
          });
        }

        let JSON_answers = {
          answers: [],
        };

        const generated_id = random_id();

        client.database
          .prepare(
            `
INSERT INTO tickets(tickid, userid, answers, guildid, io, moderatorid, channelid, threadid, completedmain)
VALUES 
  (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
          )
          .run(
            generated_id,
            interaction.member.id.toString(),
            JSON.stringify(JSON_answers),
            interaction.guild.id.toString(),
            0,
            -1,
            interaction.channel.id.toString(),
            -1,
            0
          );

        // Calculate the MAX autoarchiveduration

        let boost_level = interaction.guild.premiumTier;

        let MAX;
        switch (boost_level) {
          case "NONE":
            MAX = 1440;
            break;

          case "TIER_1":
            MAX = 4320;
            break;

          case "TIER_2":
          case "TIER_3":
            MAX = 10080;
            break;
        }

        const new_thread = await interaction.channel.threads
          .create({
            name: "Verification Thread - " + generated_id,
            autoArchiveDuration: MAX, // Set the archive duration to max based on the guild's features
            reason: "Verification Thread",
            type: ChannelType.PrivateThread,
          })
          .then((thread) => {
            // Update the thread id in the database
            client.database
              .prepare(`UPDATE tickets SET threadid = ? WHERE tickid = ?`)
              .run(thread.id, generated_id);

            let JSON_object = JSON.parse(server_information.questions);
            let thread_embed = new EmbedBuilder()
              .setColor(0x2f3136)
              .setTitle(`Welcome to ${interaction.guild.name}'s Verification`)
              .setFooter({ text: `ID: ${generated_id}` });

            if (JSON_object.questions.length > 1) {
              thread_embed.setDescription(
                `Please answer the following ${JSON_object.questions.length} questions to verify yourself`
              );
            } else {
              thread_embed.setDescription(
                `Please answer the following question to verify yourself`
              );
            }

            if (server_information.init) {
              thread_embed.setDescription(server_information.init);
            }

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`proceed-${generated_id}`)
                .setLabel("Continue")
                .setStyle(ButtonStyle.Success)
            );

            thread.send({
              embeds: [thread_embed],
              components: [row],
              content: interaction.member.toString(),
            });

            interaction.followUp({
              content: `A verification ticket has been created, ${thread.toString()}`,
              ephemeral: true,
            });

            //thread.members.add(interaction);
          });
      } else {
        // Thread question system has not been setup

        // Check if captcha is needed
        if (server_information.captcha === 1) {
          // Check if the user already has a captcha
          let captcha_db = client.database
            .prepare(
              `
          SELECT * FROM captcha WHERE userid = ? AND guildid = ?`
            )
            .get(
              interaction.member.id.toString(),
              interaction.guild.id.toString()
            );
          if (captcha_db) {
            /*// User has a captcha, check if it's expired
            if (captcha.expiration < Date.now()) {
              // Captcha is expired, delete it and create a new one
              client.database.prepare(`DELETE FROM captcha WHERE userid = ?, guildid = ?`
              ).run(interaction.member.id.toString(), interaction.guild.id.toString());
            } else {
              // Captcha is not expired, send it
              let captcha_embed = new EmbedBuilder()
                .setColor(0x2f3136)
                .setTitle(interaction.guild.name + "'s Verification Ticket")
                .setDescription(
                  `Please solve the following captcha to verify yourself`
                )
                .setFooter({ text: `ID: ${captcha.id}` });
              interaction.reply({ embeds: [captcha_embed] });
              return;
            }*/

            let captcha_embed = new EmbedBuilder()
              .setColor(0xffa500)
              .setDescription("You already have a captcha, please solve it");

            return interaction.followUp({
              embeds: [captcha_embed],
              ephemeral: true,
            });
          }
          // Generate captcha
          const captcha = new Captcha();
          captcha.async = false;
          captcha.addDecoy(); //Add decoy text on captcha canvas.
          captcha.drawTrace(); //draw trace lines on captcha canvas.
          captcha.drawCaptcha();

          const attachment = new AttachmentBuilder(captcha.png, {
            name: "captcha.png",
          });

          // Save the captcha in the database
          client.database
            .prepare(
              `
          INSERT INTO captcha (text, userid, guildid)
          VALUES (?, ?, ?)
          `
            )
            .run(
              captcha.text,
              interaction.member.id.toString(),
              interaction.guild.id.toString()
            );


          const embed = new EmbedBuilder()
            .setColor(0xffa500)
            .setTitle("Captcha")
            .setDescription(
              "*This server requires you to complete a captcha to verify yourself*"
            )
            .setImage(`attachment://captcha.png`);

          // Create answer button
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`captchabutton-${captcha.text}`)
              .setLabel("Answer")
              .setStyle(ButtonStyle.Success)
          );

          return await interaction
            .followUp({
              embeds: [embed],
              files: [attachment],
              ephemeral: true,
              components: [row],
            })
            .then(() => {
              // Set time
              /*
              This is not resilient, and needs to be improved in the future for scalability.
              It's only alive for 30 seconds, so it doesn't matter as of now.
              */
              setTimeout(
                invalidate_captcha,
                30000,
                client,
                interaction,
                interaction.member.id,
                interaction.guild.id,
                captcha.text
              );
            });
        } else {
          let role = interaction.guild.roles.cache.find(
            (r) => r.name === server_information.role
          );
          if (!role || role !== undefined || role !== null) {
            await interaction.member.roles
              .add(role)
              .then(() => {
                const Success = new EmbedBuilder()
                  .setColor(0xffffff)
                  .setDescription(
                    `<a:success:884527566688509982> | Verification was successful!`
                  );
                return interaction.followUp({
                  embeds: [Success],
                  ephemeral: true,
                });
              })
              .catch((error) => {
                // Check if error is because of missing permissions
                if (error.code === 50013) {
                  const Error = new EmbedBuilder()
                    .setColor(0xffa500)
                    .setDescription(
                      "<a:warning1:890012010224431144> | An error has occured"
                    )
                    .setFooter({
                      text: `I don't seem to have the proper access to verify you`,
                    });
                  return interaction.followUp({
                    embeds: [Error],
                    ephemeral: true,
                  });
                } else {
                  const Error = new EmbedBuilder()
                    .setColor(0xffa500)
                    .setDescription(
                      "<a:warning1:890012010224431144> | An error has occured"
                    )
                    .setFooter({
                      text: `An error occured while trying to verify you`,
                    });
                  return interaction.followUp({
                    embeds: [Error],
                    ephemeral: true,
                  });
                }
              });
          } else {
            const Error = new EmbedBuilder()
              .setColor(0xffa500)
              .setDescription(
                "<a:warning1:890012010224431144> | An error has occured"
              )
              .setFooter({
                text: `Uh oh! Seems like the verified role is missing\nYou might want to tell your local server administrators about this!`,
              });
            return interaction.followUp({ embeds: [Error], ephemeral: true });
          }
        }
      }
    } else {
      const Error = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          "<a:warning1:890012010224431144> | An error has occured"
        )
        .setFooter({ text: `You've already been verified!` });
      return interaction.followUp({ embeds: [Error], ephemeral: true });
    }
  },
};
