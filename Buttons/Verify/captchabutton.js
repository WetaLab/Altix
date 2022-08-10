const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  id: "captchabutton",
  async execute(interaction, client) {
    let captcha_answer = interaction.customId.split("-")[1];
    let server_information = client.database
      .prepare(`SELECT * FROM verifysettings WHERE guildid = ?`)
      .get(interaction.guild.id.toString());
    if (!server_information) {
      let Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(
          `There is no verification setup!\n Use /setup to create one`
        );
      return interaction.reply({
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
        captcha_answer
      );
    if (!captcha) {
      let Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(`The captcha you entered is invalid!`);
      return interaction.reply({
        embeds: [Error],
        ephemeral: true,
      });
    }

    // Check if they've already been verified
    if (
      interaction.member.roles.cache.some(
        (r) => r.name === server_information.role
      )
    ) {
      const Error = new EmbedBuilder()
        .setColor(0xffffff)
        .setTitle("Something ain't right here!")
        .setDescription(`You've already been verified!`);
      return interaction.reply({ embeds: [Error], ephemeral: true });
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

    await interaction.showModal(modal).catch(() => {});
    interaction.deferUpdate().catch(() => {});
  },
};
