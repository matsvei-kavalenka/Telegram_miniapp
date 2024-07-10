const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
});

const User = mongoose.model('User', userSchema);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = new User({ telegramId: chatId.toString() });
    await user.save();
    console.log(chatId.toString())
    bot.sendMessage(chatId, 'Welcome! Your Telegram ID has been saved.');
  } catch (err) {
    if (err.code === 11000) {
      bot.sendMessage(chatId, 'Welcome back! Your Telegram ID is already saved.');
    } else {
      bot.sendMessage(chatId, 'An error occurred while saving your Telegram ID.');
      console.error(err);
    }
  }
});
