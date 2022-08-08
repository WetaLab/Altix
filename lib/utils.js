module.exports = {
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
