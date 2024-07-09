const { Telegraf } = require("telegraf");
const TOKEN = "7457579694:AAFhRclqf7Td0Qr6Lvped6t8qNWMrrzSuvU";
const bot = new Telegraf(TOKEN);
const web_link = "https://fec3-213-197-171-233.ngrok-free.app";
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/database-db");


bot.start((ctx) =>
  ctx.reply(web_link, {
    reply_markup: {
      keyboard: [[{ text: "web app", web_app: { url: web_link } }]],
    },
  })
);


bot.launch()


