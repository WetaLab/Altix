const { readdirSync } = require("fs");

module.exports = (client, Discord) => {
  const modal_folder = readdirSync("./Modals");
  for (const folder of modal_folder) {
    const modal_files = readdirSync(`./Modals/${folder}`).filter((files) =>
      files.endsWith(".js")
    );
    for (const file of modal_files) {
      const modal = require(`../Modals/${folder}/${file}`);
      client.modals.set(modal.id, modal);
    }
  }
};
