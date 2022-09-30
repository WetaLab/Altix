// This file only contains a few helper functions that are used throughout the bot.

const { EmbedBuilder } = require("discordjs-latest");

module.exports = {
  invalidate_captcha: function (client, interaction, userid, guildid, text) {
    // First check if it's a thread verification, if so ignore it, because it's unhandled for now
    if (!interaction.channel) return;
    if (interaction.channel.isThread()) return;

    // Check if the captcha still exists
    let captcha = client.database
      .prepare(
        `SELECT * FROM captcha WHERE guildid = ? AND userid = ? AND text = ?`
      )
      .get(guildid, userid, text);
    if (!captcha) {
      return;
    }
    let ran_out_of_time = new EmbedBuilder()
      .setColor(0xffa500)
      .setDescription(
        `***Ran out of time***\nYou ran out of time to answer the captcha.`
      );

    interaction.followUp({
      embeds: [ran_out_of_time],
      ephemeral: true,
    });

    // Delete the captcha from db
    client.database
      .prepare(
        `DELETE FROM captcha WHERE userid = ? AND guildid = ? AND text = ?`
      )
      .run(userid, guildid, text);
  },

  calculate_future_time: function (minutes) {
    // check if minutes is bigger than 60, if so, use setHours() and then add the remaining minutes
    if (minutes > 60) {
      let hours = Math.floor(minutes / 60);
      let remaining_minutes = minutes % 60;
      let future_time = new Date();
      future_time.setHours(future_time.getHours() + hours);
      future_time.setMinutes(future_time.getMinutes() + remaining_minutes);
      return future_time;
    } else {
      let future_time = new Date();
      future_time.setMinutes(future_time.getMinutes() + minutes);
      return future_time;
    }
    /*const minutesToAdd = minutes;
    const currentDate = new Date();
    var futureDate = new Date()
      .setMinutes(currentDate.getMinutes() + minutesToAdd);

    console.log("Time: ", futureDate);
    return futureDate;*/
  },

  create_time_warning: function (client, tickid, guild) {
    // Only called in proceed.js
    let ticket = client.database
      .prepare(`SELECT * FROM tickets WHERE tickid = ? AND guildid = ?`)
      .get(tickid, guild.id.toString());

    if (!ticket) return;

    if (ticket.completedmain == 1) {
      return;
    }

    let time_warning = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("Hello? Is anyone there?")
      .setDescription(
        `You only have 15 minutes left to complete this ticket.\nIf you don't complete it, it will be automatically closed.`
      )
      .setFooter({
        text: `You will be able to create a new ticket once this one is closed.`,
      });

    let channel = guild.channels.cache.get(ticket.channelid);
    if (channel) {
      let thread = channel.threads.cache.get(ticket.threadid);
      if (thread) {
        thread.send({ embeds: [time_warning] }).catch(() => {});
      }
    }
  },
  invalidate_specific_ticket: async function (client, tickid, guild) {
    // Only called in proceed.js
    let ticket = client.database
      .prepare(`SELECT * FROM tickets WHERE tickid = ? AND guildid = ?`)
      .get(tickid, guild.id);

    if (!guild) {
      return;
    }

    if (!ticket) {
      return;
    }

    if (ticket.completedmain == 1) {
      return;
    }

    // Delete the thread first
    let channel = guild.channels.cache.get(ticket.channelid);
    if (channel) {
      let thread = channel.threads.cache.get(ticket.threadid);
      if (thread) {
        thread.delete();
      }
    }

    // Send the message to the user
    let user = client.users.cache.get(ticket.userid);
    if (user) {
      let ticket_invalidated_embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription(
          `***Verification ticket invalidated***\nYou ran out of time to complete your verification.`
        )
        .setAuthor({
          name: guild.name,
          iconURL: guild.iconURL(),
        })
        .setFooter({
          text: `Feel free to create a new ticket.`,
        })
        .setTimestamp();
      await user.send({ embeds: [ticket_invalidated_embed] }).catch(() => {});
    }

    // Delete the ticket
    client.database.prepare(`DELETE FROM tickets WHERE tickid = ?`).run(tickid);

    // Try to delete the captcha
    client.database
      .prepare(`DELETE FROM captcha WHERE userid = ? AND guildid = ?`)
      .run(ticket.userid, guild.id.toString());
  },

  sanitize_string: function (string) {
    // Removes any discord formatting from the string, such as bold, italics, `, etc. and returns the sanitized string.
    return string
      .replace(/\*\*|__/g, "")
      .replace(/\*|_/g, "")
      .replace(/`/g, "");
  },

  invalidate_all_tickets: async (client, guildid, guild) => {
    // get all tickets
    let tickets = client.database
      .prepare(`SELECT * FROM tickets WHERE guildid = ?`)
      .all(guildid);
    for (let i = 0; i < tickets.length; i++) {
      // Send user a message saying that the ticket has been invalidated
      let user = client.users.cache.get(tickets[i].userid);
      if (user) {
        user.send({
          embeds: [
            {
              author: {
                name: guild.name,
                icon_url: guild.iconURL(),
              },
              description:
                "Your ticket has been invalidated, please try again.",
              color: 0xffa500,
              footer: {
                text: "The verification process was updated, therefore all active tickets have been invalidated.",
              },
            },
          ],
        });
      }
      // Remove the thread
      let channel = guild.channels.cache.get(tickets[i].channelid);
      if (channel) {
        let thread = channel.threads.cache.get(tickets[i].threadid);
        if (thread) {
          thread.delete();
        }
      }
      // Delete the ticket
      // (This is bad practice, as this will run more database queries than necessary)
      client.database
        .prepare(`DELETE FROM tickets WHERE tickid = ?`)
        .run(tickets[i].tickid);
    }
    //client.database.prepare(`DELETE FROM tickets WHERE guildid = ?`).run(guildid);
  },
};
