const Discord = require("discordjs-latest");
const SQLite = require("better-sqlite3");

const {
  GatewayIntentBits,
  Partials,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  PermissionsBitField,
} = require("discordjs-latest");

const token = process.env["TOKEN"];

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
client.buttons = new Collection();
client.modals = new Collection();

// Setup database
const db = new SQLite("./Altix.sqlite");
db.prepare(
  `
CREATE TABLE IF NOT EXISTS verifysettings (
  guildid BLOB PRIMARY KEY, questions STRING, 
  channel BLOB, role STRING, captcha INTEGER,
  accepted STRING, init STRING
)
`
).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS tickets (
  tickid STRING PRIMARY KEY, userid BLOB, 
  answers STRING, guildid BLOB,
  io BOOLEAN,
  moderatorid BLOB,
  channelid BLOB,
  threadid BLOB,
  active BOOLEAN,
  timefifteen BLOB,
  timethirty BLOB,
  completedmain BOOLEAN
)
`
).run();

console.log("Active Tickets", db.prepare(`SELECT * FROM tickets`).all())
//db.prepare(`DELETE FROM tickets WHERE tickid = ?`).run("9224754627435")

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS captcha (
    text STRING PRIMARY KEY,
    userid BLOB,
    guildid BLOB
  )
  `
).run();

client.database = db;

["Events", "Commands", "Buttons", "Modals"].forEach((handler) => {
  require(`./src/Handlers/${handler}`)(client);
});

client.login(token);
