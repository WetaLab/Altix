const { readdirSync } = require('fs');

module.exports = (client, Discord) => {
    const command_folder = readdirSync('./Commands');
    for (const folder of command_folder) {
        const command_files = readdirSync(`./Commands/${folder}`).filter(files => files.endsWith('.js'));
        const commands_array = [];
        for (const file of command_files) {
            const command = require(`../Commands/${folder}/${file}`);
            client.commands.set(command.name, command);
            commands_array.push(command);

            client.on('ready', () => {
                client.guilds.cache.get("882378589364944976").commands.set(commands_array);
            })
        }
    }
}