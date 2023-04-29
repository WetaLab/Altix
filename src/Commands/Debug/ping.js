const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discordjs-latest");

module.exports = {
  name: "addquestion",
  description: "Add a new question to an existing verification process",
  permission: PermissionsBitField.Flags.Administrator,
  ephemeral: false,
  options: [],
  async execute(client, interaction) {
    const uptime = client.uptime;
    const uptime_seconds = Math.floor(uptime / 1000);
    const seconds = uptime_seconds % 60;
    const uptime_minutes = Math.floor(uptime_seconds / 60);
    const minutes = uptime_minutes % 60;
    const uptime_hours = Math.floor(uptime_minutes / 60);
    const hours = uptime_hours % 24;
    const days = Math.floor(uptime_hours / 24);

    const ping_embed = new Discord.MessageEmbed()
      .setColor("#FFFFFF")
      .setTitle(":ping_pong: Pong!")
      .addFields(
        {
          name: "`Bot Latency`",
          value: `${new Date().getTime() - message.createdTimestamp} ms`,
        },
        {
          name: "`API Latency`",
          value: `${Math.round(client.ws.ping)} ms`,
        },
        {
          name: "`Bot Uptime`",
          value: `${days} Days, ${hours} Hrs, ${minutes} Min, ${seconds} Sec`,
        }
      );

    return interaction.followUp({ embeds: [ping_embed] });
  },
};
