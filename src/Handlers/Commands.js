const { readdirSync } = require("fs");
const { client, REST, Routes } = require("discordjs-latest");
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);


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
        /*commands_array.forEach((object) => {
          client.guilds.cache.get("882378589364944976").commands.create(object);
        }); Use this only for development env*/
        
        // Production
        rest.put(
          Routes.applicationCommands("1025532290664763492"),
          { body: commands_array },
        );
        
      });
    }
  }
};
