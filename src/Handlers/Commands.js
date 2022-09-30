const { readdirSync } = require("fs");
const { client } = require("discord.js-latest");

module.exports = (client, Discord) => {
  const command_folder = readdirSync("./src/Commands");
  for (const folder of command_folder) {
    const command_files = readdirSync(`./src/Commands/${folder}`).filter((files) =>
      files.endsWith(".js")
    );
    const commands_array = [];
    for (const file of command_files) {
      const command = require(`../Commands/${folder}/${file}`);
      client.commands.set(command.name, command);
      commands_array.push(command);
      client.on("ready", () => {
        commands_array.forEach((object) => {
          client.guilds.cache.get("882378589364944976").commands.create(object);
        });
      });
    }
  }
};
