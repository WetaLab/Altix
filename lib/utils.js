const { EmbedBuilder } = require("discord.js");

module.exports = {
  create_time_warning(client, tickid, guild) {
    let ticket = client.database
      .prepare(`SELECT * FROM tickets WHERE tickid = ? AND guildid = ?`)
      .get(tickid, guild.id.toString());

    if (ticket.io == 0 && ticket.active == 1) {
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
    let ticket = client.database
      .prepare(`SELECT * FROM tickets WHERE tickid = ? AND guildid = ?`)
      .get(tickid, guild.id);

    // Delete the thread first
    let channel = guild.channels.cache.get(ticket.channelid);
    if (channel) {
      let thread = channel.threads.cache.get(ticket.threadid);
      if (thread) {
        thread.delete();
      }
    }

    if (!guild) {
      return;
    }

    if (!ticket) {
      return;
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
  },

  sanitize_string: function (string) {
    // Removes any discord formatting from the string, such as bold, italics, `, etc. and returns the sanitized string.
    return string.replace(/\*\*|__/g, "").replace(/\*|_/g, "").replace(/`/g, "");
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
