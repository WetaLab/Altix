const Discord = require('discord.js');
const { GatewayIntentBits, Partials, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, PermissionsBitField} = require('discord.js');

const { REST } = require("@discordjs/rest");
const token = process.env['TOKEN'];


//console.log(GatewayIntentBits)
const client = new Discord.Client({
  intents: [ 
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.Guilds,
           ],
  partials: [Partials.Channel],
});
module.exports = client;

client.commands = new Collection();

['Events', 'Commands'].forEach(handler => {
  require(`./Handlers/${handler}`)(client);
})


client.login(token);