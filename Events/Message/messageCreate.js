/*
NOTE NOTE NOTE! The reason why this isn't split up
into multiple files like all other handlers are because
this function will only be called in one context which
is messages in verification ticket threads, as commands
are handled with interactions, and message commands are
obsolete.
*/

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