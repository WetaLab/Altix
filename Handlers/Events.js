const { readdirSync } = require("fs");

module.exports = (client, Discord) => {
  const event_folders = readdirSync("./Events");
  for (const folder of event_folders) {
    const event_files = readdirSync(`./Events/${folder}`).filter((files) =>
      files.endsWith(".js")
    );
    for (const file of event_files) {
      const event = require(`../Events/${folder}/${file}`);
      if (event.once) {
        client.once(event.name, (...args) =>
          event.execute(...args, client, Discord)
        );
      } else {
        client.on(event.name, (...args) =>
          event.execute(...args, client, Discord)
        );
      }
    }
  }
};
