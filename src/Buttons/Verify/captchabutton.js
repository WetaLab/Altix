const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discordjs-latest");

const { Captcha } = require("captcha-canvas");
const { invalidate_captcha } = require("../../lib/utils.js"); // Load the utils library

module.exports = {
  id: "captchabutton",
  ephemeral: true,
  defer: false,
  async execute(interaction, client) {
    let captcha_answer = interaction.customId.split("-")[1];
    let server_information = client.database
      .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
      .get(interaction.guild.id.toString());

    if (!server_information) {
      let Error = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          "<a:warning1:890012010224431144> | An error has occured"
        )
        .setFooter({
          text: `There is no verification setup!\n Use /setup to create one`,
        });
      return interaction.followUp({
        embeds: [Error],
        ephemeral: true,
      });
    }

    // Check if the captcha still exists
    let captcha = client.database
      .prepare(
        `SELECT * FROM captcha WHERE guildid = ? AND userid = ? AND text = ?`
      )
      .get(
        interaction.guild.id.toString(),
        interaction.member.id.toString(),
        captcha_answer.toUpperCase()
      );
    if (!captcha) {
      // Check if there are any other valid captchas
      let other_captcha = client.database
        .prepare(`SELECT * FROM captcha WHERE guildid = ? AND userid = ?`)
        .get(interaction.guild.id.toString(), interaction.member.id.toString());

      if (!other_captcha) {
        // Generate a new captcha if no other valid captchas exist
        const captcha = new Captcha();
        captcha.async = false;
        captcha.addDecoy(); // Add decoy text on captcha canvas
        captcha.drawTrace(); // Draw trace lines on captcha canvas
        captcha.drawCaptcha();
        const attachment = new AttachmentBuilder(captcha.png, {
          name: "captcha.png",
        });

        let embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setDescription(
            `***New Captcha Generated***\nPlease answer the captcha below.`
          )
          .setImage(`attachment://captcha.png`);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`captchabutton-${captcha.text}`)
            .setLabel("Answer")
            .setStyle(ButtonStyle.Success)
        );

        client.database
          .prepare(
            `
            INSERT INTO captcha (userid, guildid, text) VALUES (?, ?, ?)
            `
          )
          .run(
            interaction.member.id.toString(),
            interaction.guild.id.toString(),
            captcha.text
          );

        setTimeout(
          invalidate_captcha,
          30000,
          client,
          interaction,
          interaction.member.id,
          interaction.guild.id,
          captcha.text
        );

        // Edit the old captcha message to disable the button
        let row_old = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`invalid-do-not-use`)
            .setLabel("Answer")
            .setDisabled(true)
            .setStyle(ButtonStyle.Success)
        );
        await interaction.message.edit({
          components: [row_old],
        });

        return interaction.followUp({
          files: [attachment],
          embeds: [embed],
          components: [row],
        }).catch(e => {
          return interaction.reply({
            files: [attachment],
            embeds: [embed],
            components: [row],
          })
        })
      } else {
        let Error = new EmbedBuilder()
          .setColor(0xffa500)
          .setDescription(
            "<a:warning1:890012010224431144> | An error has occured"
          )
          .setFooter({
            text: `The captcha you entered is invalid!`,
          });
        return interaction
          .followUp({
            embeds: [Error],
            ephemeral: true,
          })
          .catch((e) => {
            return interaction.reply({
              embeds: [Error],
              ephemeral: true,
            });
          });
      }
    }

    // Check if they've already been verified
    if (
      interaction.member.roles.cache.some(
        (r) => r.name === server_information.role
      )
    ) {
      const Error = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          "<a:warning1:890012010224431144> | An error has occured"
        )
        .setFooter({ text: `You've already been verified!` });
      return interaction.followUp({ embeds: [Error], ephemeral: true });
    }

    // Create modal
    let modal = new ModalBuilder()
      .setCustomId(`captchamodal-${captcha_answer}`)
      .setTitle("Verify Captcha");

    // Create text input
    const textInput = new TextInputBuilder()
      .setCustomId(`captchamodal-answer`)
      .setLabel("Answer")
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(textInput);
    modal.addComponents(row);

    await interaction.showModal(modal).catch((err) => {
      console.log(err);
    });
  },
};
