/*
NOTE NOTE NOTE! The reason why this isn't split up
into multiple files like all other handlers are because
this function will only be called in one context which
is messages in verification ticket threads, as commands
are handled with interactions, and message commands are
obsolete.
*/

const {
  Client,
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discordjs-latest");

const { writeFileSync, unlinkSync } = require("fs");
const { Captcha } = require("captcha-canvas");

module.exports = {
  name: "messageCreate",
  /**
   * @param {Message} message
   * @param {Client} client
   * @param {Discord} Discord
   **/
  async execute(message, client, Discord) {
    if (!message.channel.isThread()) return;
    let thread_title = message.channel.name;

    // Check if thread is a verification thread etc etc here
    let thread_information;
    let thread_id;

    try {
      thread_id = thread_title.split("-")[1];
      thread_information = client.database
        .prepare(
          `
SELECT 
  * 
FROM 
  tickets 
WHERE 
  tickid = ?
`
        )
        .get(thread_id);
    } catch (error) {
      // It's not a verification thread
      return;
    }

    if (!thread_information) return;
    if (message.author.bot) return;
    if (
      !(message.author.id == thread_information.userid) &&
      !(message.author.id == parseInt(thread_information.moderatorid)) /*&&
      !message.member.hasPermission("ADMINISTRATOR")*/
    ) {
      return message.delete();
    }

    if (thread_information.io == 0 && thread_information.moderatorid == -1) {
      return message.delete();
    }

    // Ignore messages if moderator is set
    if (thread_information.moderatorid != -1) {
      if (
        message.author.id != thread_information.moderatorid &&
        message.author.id != thread_information.userid
      ) {
        return message.delete().catch(() => {});
      } else {
        return;
      }
    }

    let server_information = client.database
      .prepare(
        `
SELECT 
  * 
FROM 
  verifysettings 
WHERE 
  guildid = ?
`
      )
      .get(message.guild.id.toString());

    let answers = JSON.parse(thread_information.answers).answers;
    let questions = JSON.parse(server_information.questions).questions;
    let question = JSON.parse(server_information.questions).questions[
      answers.length + 1
    ];

    answers.push({
      content: message.content,
    });
    let database_complient_answers = JSON.stringify({ answers: answers });
    client.database
      .prepare(
        `
UPDATE 
  tickets 
SET 
  answers = ? 
WHERE 
  tickid = ?
`
      )
      .run(database_complient_answers, thread_id);

    if (
      answers.length ==
      JSON.parse(server_information.questions).questions.length
    ) {
      // Submit the answers to the verification review channel

      // Check if captcha is enabled
      if (server_information.captcha == 1) {
        // Disable talking in the thread
        client.database
          .prepare(
            `
UPDATE 
  tickets 
SET 
  io = 0 
WHERE 
  tickid = ?
`
          )
          .run(thread_id);
        // Generate captcha
        const captcha = new Captcha();
        captcha.async = false;
        captcha.addDecoy(); //Add decoy text on captcha canvas.
        captcha.drawTrace(); //draw trace lines on captcha canvas.
        captcha.drawCaptcha();
        await writeFileSync(`./captcha_${captcha.text}.png`, captcha.png);

        // Add captcha to the database
        client.database
          .prepare(
            `
          INSERT INTO captcha (text, userid, guildid)
          VALUES (?, ?, ?)
          `
          )
          .run(
            captcha.text,
            message.author.id.toString(),
            message.guild.id.toString()
          );

        const embed = new EmbedBuilder()
          .setColor(0xffa500)
          .setTitle("Captcha")
          .setDescription(
            "*This server requires you to complete a captcha to proceed*"
          )
          .setImage(`attachment://captcha_${captcha.text}.png`);

        // Create answer button
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`captchabutton-${captcha.text}`)
            .setLabel("Answer")
            .setStyle(ButtonStyle.Success)
        );

        return await message.channel
          .send({
            embeds: [embed],
            files: [`./captcha_${captcha.text}.png`],
            components: [row],
          })
          .then(() => {
            // Delete the captcha file
            unlinkSync(`./captcha_${captcha.text}.png`);
          });
      } else {
        client.database
          .prepare(
            `
UPDATE 
  tickets 
SET 
  io = 0 
WHERE 
  tickid = ?
`
          )
          .run(thread_id);
        console.log("server information",server_information)
        message.guild.channels
          .fetch(server_information.channel)
          .then((channel) => {
            let review_embed = new EmbedBuilder()
              .setColor(0xffffff)
              .setTitle("Verification Review")
              .setAuthor({
                name: message.author.tag,
                iconURL: message.author.avatarURL(),
              })
              // Here we add all the answers, in the format of `Question`: Answer
              .addFields({
                name: "Answers",
                value: answers
                  .map(
                    (answer, index) =>
                      `\`${questions[index].content}:\` ${answer.content}`
                  )
                  .join("\n"),
              })
              .setFooter({
                text: `ID: ${thread_id}`,
              });

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`accept-${thread_id}`)
                .setLabel("Accept")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`reject-${thread_id}`)
                .setLabel("Reject")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`manual-${thread_id}`)
                .setLabel("Ask Manual Questions")
                .setStyle(ButtonStyle.Primary)
            );

            client.database
              .prepare(`UPDATE tickets SET completedmain = 1 WHERE tickid = ?`)
              .run(thread_id);

            channel
              .send({ embeds: [review_embed], components: [row] })
              .then(() => {
                let Response = new EmbedBuilder()
                  .setColor(0xffffff)
                  .setDescription(
                    `**Your verification has been successfully submitted for review.**`
                  )
                  .setFooter({
                    text: `Please wait patiently for a moderator to review your verification.`,
                  });
                message.channel.send({ embeds: [Response] });
                message.channel.setName(`Pending - ${thread_id}`);
              })
              .catch((error) => {
                console.log(error);
                let Response = new EmbedBuilder()
                  .setColor(0xffa500)
                  .setDescription(
                    `**There was an error submitting your verification.**`
                  )
                  .setFooter({
                    text: `Please try again later.`,
                  });
                message.author.send({ embeds: [Response] }).catch(() => {});

                // Delete the ticket from the database so it can be re-opened
                client.database
                  .prepare(
                    `
DELETE FROM 
  tickets 
WHERE 
  tickid = ?
`
                  )
                  .run(thread_id);
                message.channel.delete();
              });
          });
        return;
      }
    }

    // Ask next question
    let specifics = "";
    if (question.specifics != "") {
      specifics = `\n\`${question.specifics}\``;
    }
    let question_embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle(`Question ${answers.length + 1}/${questions.length}`)
      .setDescription("> ***" + question.content + "***" + specifics);

    message.channel.send({
      embeds: [question_embed],
    });
  },
};
