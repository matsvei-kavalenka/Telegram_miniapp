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

const userStates = {};

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

// --- /start command ---
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

// --- /show_daily_plans command ---
bot.onText(/\/show_daily_plans/, async (msg) =>{
  const chatId = msg.chat.id;

  try {
    await User.findOne({ telegramId: chatId.toString() });

    const markup = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'To-do', callback_data: 'show_daily_todo' },
            { text: 'Events', callback_data: 'show_daily_events' },
            { text: 'All', callback_data: 'show_daily_all' }
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

// --- /show_plans_between command ---
bot.onText(/\/show_plans_between/, async (msg) =>{
  const chatId = msg.chat.id;

  try {
    await User.findOne({ telegramId: chatId.toString() });
    userStates[chatId] = { step: 'start_date' };
    bot.sendMessage(chatId, 'Choose dates for which you would like to print plans:\n\nEnter start date in format dd-mm-yyyy ( e.g. 01-01-2024)');

  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while fetching your plans.');
    console.error(err);
  }
  
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (userStates[chatId]) {
    const state = userStates[chatId].step;

    if (state === 'start_date') {
      if (!moment(msg.text, "DD-MM-YYYY", true).isValid()){
        bot.sendMessage(chatId, 'Wrong date format. Enter start date in format dd-mm-yyyy (e.g. 01-01-2024)');
        return;
      }
      userStates[chatId].startDate = msg.text;
      userStates[chatId].step = 'end_date';
      bot.sendMessage(chatId, 'Enter end date in format dd-mm-yyyy (e.g. 01-01-2024)');
      
    } 
    else if (state === 'end_date') {
      if (!moment(msg.text, "DD-MM-YYYY", true).isValid()){
        bot.sendMessage(chatId, 'Wrong date format. Enter end date in format dd-mm-yyyy (e.g. 01-01-2024)');
        return;
      }
      userStates[chatId].endDate = msg.text;
      
      const startDate = userStates[chatId].startDate;
      const endDate = userStates[chatId].endDate;

      const todos = await getTodos(chatId, startDate, endDate)
      const events = await getEvents(chatId, startDate, endDate);
      if (!todos && !events) {
        responseMessage = 'No plans for today';
      }
      else{
        responseMessage = `${todos}\n\n\n${events}`;
      }
      
      bot.sendMessage(chatId, escapeMarkdown(responseMessage), { parse_mode: 'MarkdownV2' });
      delete userStates[chatId];
    }
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;
  const today = mongoFormatDate(new Date());

  try {
    let responseMessage;

    switch (action) {
      case 'show_daily_todo':
        responseMessage = await getTodos(chatId, today);
        if (!responseMessage) {
          responseMessage = 'No plans for today';
          break;
        }
        break;
      case 'show_daily_events':
        responseMessage = await getEvents(chatId, today);
        if (!responseMessage) {
          responseMessage = 'No plans for today';
          break;
        }
        break;
      case 'show_daily_all':
        const todos = await getTodos(chatId, today)
        const events = await getEvents(chatId, today);
        if (!todos && !events) {
          responseMessage = 'No plans for today';
          break;
        }
        else if (!todos && events){
          responseMessage = `${events}`;
          break;
        }
        else if (todos && !events){
          responseMessage = `__*Today's To-do*__:\n${todos}\n\n\n${events}`;
          break;
        }
        responseMessage = `${todos}\n\n\n${events}`;
        
        break;
      default:
        responseMessage = 'Unknown action!';
    }

    bot.answerCallbackQuery(callbackQuery.id);
    bot.sendMessage(chatId, escapeMarkdown(responseMessage), { parse_mode: 'MarkdownV2' });

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
      return '*You don\'t have any Events for today*';
    }
    
    const todayData = data.find(block => block.date === date1);

    if (!todayData) {
      return '*You don\'t have any Events for today*';
    }

    const encryptedData = decryptData(todayData.events);

    const formattedEvents = encryptedData.map(event => {
      const eventTime = moment(event.time).format('HH:mm');
      return `*${eventTime}* - ${event.text}`;
    }).join('\n');

    
    return `__*Today's events*__:\n${formattedEvents}`;
  }
  else{
    const data = await Event.find({ userId: chatId.toString(), date: {$gte: date1, $lte: date2 }});
    if (data.length === 0) {
      return '*You don\'t have any Events for this day*';
    }
    const newData = data.map(day => {
      const encryptedData = decryptData(day.events);
      const formattedEvents = encryptedData.map(event => {
        const eventTime = moment(event.time).format('HH:mm');
        return `*${eventTime}* - ${event.text}`;
      }).join('\n');
      return `*➤ ${day.date}*\n${formattedEvents}\n`;
    }).join('\n').trim();
    return `__*Today's events*__:\n${newData}`;
  }

};

const getTodos = async (chatId, date1, date2) => {
  if (date2 === undefined) {
    const data = await Todo.find({ userId: chatId.toString(), date: date1 });
    if (data.length === 0) {
      return '*You don\'t have any To-Do\'s for today*';
    }
    
    const todayData = data.find(block => block.date === date1);

    if (!todayData) {
      return '*You don\'t have any To-Do\'s for today*';
    }

    const encryptedData = decryptData(todayData.todos);
    const formattedTodos = encryptedData.map((todo) => {
      if (todo.checked) {
        return `●  ~${todo.text}~`;
      }
      return `○  ${todo.text}`;
    }).join('\n');

    return `__*Today's To-do*__:\n${formattedTodos}`;
    
  }
  else{
    const data = await Todo.find({ userId: chatId.toString(), date: {$gte: date1, $lte: date2 }});
    if (data.length === 0) {
      return '*You don\'t have any To-Do\'s for this day*';
    }

    const todos = data.map(day => {
      const encryptedData = decryptData(day.todos);
      const formattedTodos = encryptedData.map((todo) => {
        if (todo.checked) {
          return `●  ~${todo.text}~`;
        }
        return `○  ${todo.text}`;
      }).join('\n');
      return `*➤ ${day.date}*\n${formattedTodos}\n`;
    }).join('\n').trim();


    return `__*Today's To-Do's*__:\n${todos}`;
  }
};

const decryptData = (encryptedData) => {
  const decryptedData = CryptoJS.AES.decrypt(encryptedData, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedData);
};

const escapeMarkdown = (text) => {
  const markdownChars = ['[', ']', '(', ')', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  let escapedText = text;
  markdownChars.forEach((char) => {
    escapedText = escapedText.replace(new RegExp(`\\${char}`, 'g'), `\\${char}`);
  });
  return escapedText;
};

module.exports = bot;