const Discord = require('discord.js')
const { GatewayIntentBits, Partials, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

console.log(GatewayIntentBits)

const rest = new REST({version: '10'}).setToken(token);



client.on('ready' , () =>{
  client.user.setStatus('idle');
  client.user.setActivity('with meat');
  startup();
});

client.on('interactionCreate', async (interaction) => {
  if(!interaction.isChatInputCommand()){
    return;
  }
  let { commandName, options } = interaction;

  switch(commandName){
    case "setup":
      var channel = options.getChannel("channel");
      var role = options.getRole("role");
      var custom_content = options.getString("content");
      const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('verify')
					.setLabel('Verify')
					.setStyle(ButtonStyle.Primary),
			);
      interaction.reply({
         embeds: [{
            title: `Verification`,
            description: custom_content,
            color: 0xffffff,
         }],
        components: [row],
      })
      /*interaction.reply({
        embeds: [{
            title: `Setup Process`,
            description: `A message has been sent to ${channel.toString()} From there, you can add verification questions`,
            color: 0xffffff,
         }],
        ephemeral: true,
      })*/
      break
  }
})



/*
{
   embeds: [{
      title: `${client.user.username}'s Help Page`,
      description: `https://help.tcb.jayeshrocks.xyz`,
      color: "RANDOM"
   }],
   //this is the important part
   ephemeral: true
}
*/

async function startup(){

  /* 
  This is for non-production environment, use global
  commands later on
  */
  
  const guildId = "882378589364944976"
  const guild = client.guilds.cache.get("882378589364944976");
  console.log(guild)
  let commands

  /*if (guild) {
    commands = guild.commands
  } else {
    commands = client.application.commands
  }*/
  commands = guild.commands

  commands.create({
    name: 'setup',
    description: 'Create a new verification entry',
    options: [
      {
        name: "content",
        description: "The message that will be displayed by the bot",
        type: 3,
        required: true,
      },
      {
        name: "channel",
        description: "Channel for reviewers to accept verifications",
        type: 7,
        required: true,
      },
      {
        name: 'role',
        description: "The role to be given once verified",
        type: 8,
        required: true,
      },
    ],
  })
}

client.login(token);