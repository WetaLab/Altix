const { readdirSync } = require("fs");

module.exports = (client, Discord) => {
  const button_folder = readdirSync("./Buttons");
  for (const folder of button_folder) {
    const button_files = readdirSync(`./Buttons/${folder}`).filter((files) =>
      files.endsWith(".js")
    );
    for (const file of button_files) {
      const button = require(`../Buttons/${folder}/${file}`);
      client.buttons.set(button.id, button);
    }
  }
};
