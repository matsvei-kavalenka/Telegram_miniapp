const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const { Todo, Event,User } = require('../models');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const secretKey = 
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


bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = new User({ telegramId: chatId.toString() });
    await user.save();
    bot.sendMessage(chatId, 'Welcome!');
  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while saving your Telegram ID.');
    console.error(err);
  }
});


bot.onText(/\/show_plans_today/, async (msg) =>{
  const chatId = msg.chat.id;

  try {
    await User.findOne({ telegramId: chatId.toString() });

    const markup = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'To-do', callback_data: 'show_today_todo' },
            { text: 'Events', callback_data: 'show_today_events' },
            { text: 'All', callback_data: 'show_today_all' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, 'Choose what would you like to print:' + '\n\n', markup);

  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while fetching your plans.');
    console.error(err);
  }
});


bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;
  const today = mongoFormatDate(new Date());

  try {
    let responseMessage;

    switch (action) {
      case 'show_today_todo':
        responseMessage = await getTodos(chatId, today);
        break;
      case 'show_today_events':
        responseMessage = await getEvents(chatId, today);
        break;
      case 'show_today_all':
        responseMessage = await getTodos(chatId, today) + '\n\n\n' + await getEvents(chatId, today);
        
        break;
      default:
        responseMessage = 'Unknown action!';
    }

    bot.answerCallbackQuery(callbackQuery.id);
    bot.sendMessage(chatId, responseMessage, { parse_mode: 'MarkdownV2' });

  } catch (err) {
    bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred.' });
    bot.sendMessage(chatId, 'An error occurred while processing your request.');
    console.error(err);
  }
});


const mongoFormatDate = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const getEvents = async (chatId, date1, date2) => {
  if (date2 === undefined) {
    const data = await Event.find({ userId: chatId.toString(), date: date1 });
    if (data.length === 0) {
      bot.sendMessage(chatId, 'No plans for today');
      return;
    }
    
    const todayData = data.find(block => block.date === date1);

    if (!todayData) {
      bot.sendMessage(chatId, 'No plans for today');
      return;
    }

    const encryptedData = decryptData(todayData.events);

    const formattedEvents = encryptedData.map(event => {
      const eventTime = moment(event.time).format('HH:mm');
      return `*${eventTime}* \\- ${event.text}`;
    }).join('\n');

    
    return `*Today's events*:\n${formattedEvents}`;
  }
  
};

const getTodos = async (chatId, date1, date2) => {
  if (date2 === undefined) {
    const data = await Todo.find({ userId: chatId.toString(), date: date1 });
    if (data.length === 0) {
      bot.sendMessage(chatId, 'No plans for today');
      return;
    }
    
    const todayData = data.find(block => block.date === date1);

    if (!todayData) {
      bot.sendMessage(chatId, 'No plans for today');
      return;
    }

    const encryptedData = decryptData(todayData.todos);
    console.log(encryptedData);
    const formattedTodos = encryptedData.map((todo, index) => {
      if (todo.checked) {
        return `●  ~${todo.text}~`;
      }
      return `○  ${todo.text}`;
    }).join('\n');

    return `*Today's To\\-do*:\n${formattedTodos}`;
    
  }
};

const decryptData = (encryptedData) => {
  const decryptedData = CryptoJS.AES.decrypt(encryptedData, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedData);
};

module.exports = bot;