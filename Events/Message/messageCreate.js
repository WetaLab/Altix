const { Client, Message } = require('discord.js');

module.exports = {
  name: "messageCreate",
  /**
  * @param {Client} client
  * @param {Message} message
  **/
  async execute(message, client, Discord) {
    if(!message.channel.isThread()) return;
    let thread_title = message.channel.name;

    // Check if thread is a verification thread etc etc here
  }
}