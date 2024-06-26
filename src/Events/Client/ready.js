// Load the utils library
const { ActivityType } = require("discordjs-latest");
const {
  create_time_warning,
  invalidate_specific_ticket,
} = require("../../lib/utils.js"); // Load the utils library

const set_presence = (client) => {
  console.log("Setting bot status.");
  client.user.setPresence({
    activities: [
      {
        name: `verifications`,
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });
};

module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log("Client ready for action!");

    set_presence(client);

    client.on("shardReady", () => {
      set_presence(client);
    });

    // Make a resiliency check on active ticket times
    // Loop through all tickets and set up timeout if necessary
    let all_tickets = client.database.prepare(`SELECT * FROM tickets`).all();
    all_tickets.forEach((row) => {
      if (row.completedmain == 0) {
        // Calculate the time difference between now and the future time
        let time_fifteen = new Date(Date.parse(row.timefifteen));
        let time_thirty = new Date(Date.parse(row.timethirty));
        let time_now = new Date();

        let time_difference_fifteen = time_fifteen - time_now;
        time_difference_fifteen = Math.floor(
          ((time_difference_fifteen % 86400000) % 3600000) / 60000
        );

        let time_difference_thirty = time_thirty - time_now;
        time_difference_thirty = Math.floor(
          ((time_difference_thirty % 86400000) % 3600000) / 60000
        );

        if (time_difference_fifteen < 0) {
          // Do nothing
        } else {
          // Set up timeout for 15 minutes, time_difference_fifteen must be in milliseconds
          let guild = client.guilds.cache.get(row.guildid);
          setTimeout(
            create_time_warning,
            time_difference_fifteen * 60000,
            client,
            row.tickid,
            guild
          );
        }

        if (time_difference_thirty < 0) {
          // Invalidate the ticket
          let guild = client.guilds.cache.get(row.guildid);
          invalidate_specific_ticket(client, row.tickid, guild);
        } else {
          // Set up timeout
          let guild = client.guilds.cache.get(row.guildid);
          setTimeout(
            invalidate_specific_ticket,
            time_difference_thirty * 60000,
            client,
            row.tickid,
            guild
          );
        }
      }
    });
  },
};
