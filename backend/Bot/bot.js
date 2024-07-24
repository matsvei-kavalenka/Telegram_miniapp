const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const { Todo, Event, User, Notification } = require('../models');
const CryptoJS = require('crypto-js');
const schedule = require('node-schedule');
const moment = require('moment'); 
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  setupNotification();
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});

const userStates = {};

const markupDays = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '3', callback_data: 'show_3' },
        { text: '5', callback_data: 'show_5' },
        { text: '7', callback_data: 'show_7' },
        { text: '10', callback_data: 'show_10' }
      ]
    ]
  }
};


// --- /start command ---
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    if(await User.findOne({ telegramId: chatId.toString() })){
      bot.sendMessage(chatId, 'Welcome!\n\nYou can use the following commands:\n/plans_today - to see your plans for today\n/plans_date - to see your plans for a specific date\n/plans_range - to see your plans for a range of days\n\n');
      return;
    }
    const user = new User({ telegramId: chatId.toString() });
    const notification = new Notification({ telegramId: chatId.toString(), time: '21:00', enabled: 'true' });
    await user.save();
    await notification.save();
    bot.sendMessage(chatId, 'Welcome!\n\nYou can use the following commands:\n\n/plans_today - to see your plans for today\n/plans_date - to see your plans for a specific date\n/plans_range - to see your plans for a range of days\n\n');
  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while saving your Telegram ID.');
    console.error(err);
  }
});

// --- /plans_today command ---
bot.onText(/\/plans_today/, async (msg) =>{
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

// --- /show_plans command ---
bot.onText(/\/plans_date/, async (msg) =>{
  const chatId = msg.chat.id;

  try {
    await User.findOne({ telegramId: chatId.toString() });

    userStates[chatId] = { step: 'exact_date' };
    bot.sendMessage(chatId, 'Enter the date: \nEnter start date in format dd-mm-yyyy (e.g. 15-01-2024)' + '\n\n');

  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while fetching your plans.');
    console.error(err);
  }
});

// --- /plans_range command ---
bot.onText(/\/plans_range/, async (msg) =>{
  const chatId = msg.chat.id;

  try {
    await User.findOne({ telegramId: chatId.toString() });
    const markup = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Past', callback_data: 'show_past' },
            { text: 'Future', callback_data: 'show_future' }
          ]
        ]
      }
    };
    bot.sendMessage(chatId, 'Would you like to print past or future plans?:' + '\n\n', markup);

  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while fetching your plans.');
    console.error(err);
  }
  
});

// --- /edit_notification_settings command ---
bot.onText(/\/edit_notification_settings/, async (msg) =>{
  const chatId = msg.chat.id;

  try {
    const notification = await Notification.findOne({ telegramId: chatId.toString() });
    let text = '';
    console.log(notification.enabled);

    if (notification.enabled ) {
      text = 'Turn off';
    } else if (!notification.enabled) {
      text = 'Turn on';
    } else{
      bot.sendMessage(chatId, 'An error occurred while fetching your notification settings.');
      return;
    }

    const markupNotificationSettings = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Edit time', callback_data: notification.enabled ? 'notification_time' : 'disabled_notification_time' },
          ],
          [
            { text: text, callback_data: 'turn_on_off' },
          ]
        ]
      }
    };

    bot.sendMessage(chatId, 'Choose what would you like to change:' + '\n\n', markupNotificationSettings);

  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while editing your notification settings.');
    console.error(err);
  }
  
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (userStates[chatId]) {
    const state = userStates[chatId].step;

    if (state === 'exact_date') {
      const date = msg.text;
      const todos = await getTodos(chatId, date);
      const events = await getEvents(chatId, date);
      if (!todos && !events) {
        responseMessage = 'No plans for today';
      }
      else{
        responseMessage = `${todos}\n\n\n${events}`;
      }
      
      bot.sendMessage(chatId, escapeMarkdown(responseMessage), { parse_mode: 'MarkdownV2' });
      delete userStates[chatId];
    }
    else if (state === 'notification_time') {
      const time = msg.text;
      const notificationTime = await Notification.findOne({ telegramId: chatId.toString() });
      const timePattern = new RegExp(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/);
      if (!timePattern.test(time)) {
        bot.sendMessage(chatId, 'Invalid time format. Please enter time in format HH:MM (e.g. 21:00)');
        return;
      }
      notificationTime.time = time;
      await notificationTime.save();
      setupNotification();
      bot.sendMessage(chatId, `Notification time was changed to ${time}`);
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
      case 'notification_time':
        if (!userStates[chatId]) {
          userStates[chatId] = {};
        }
        userStates[chatId].step = action;
        bot.sendMessage(chatId, `Enter new time in format HH:MM (e.g. 21:00)`);
        break;
      case 'disabled_notification_time':
        bot.sendMessage(chatId, 'You need to turn on the notification first');
        break;
      case 'turn_on_off':
        const notificationEnabled = await Notification.findOne({ telegramId: chatId.toString() });

        notificationEnabled.enabled = !notificationEnabled.enabled;
        notificationEnabled.save();
        setupNotification();

        if (!notificationEnabled.enabled) {
          bot.sendMessage(chatId, `Notification turned off`);
        } else if (notificationEnabled.enabled) {
          bot.sendMessage(chatId, `Notification turned on`);
        }

        
        
        break;
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
        case 'show_past':
        case 'show_future':
          userStates[chatId].step = action;
          bot.sendMessage(chatId, 'Choose the number of days:', markupDays);
          break;
        case 'show_3':
          responseMessage = await handleDateRange(chatId, 3);
          break;
        case 'show_5':
          responseMessage = await handleDateRange(chatId, 5);
          break;
        case 'show_7':
          responseMessage = await handleDateRange(chatId, 7);
          break;
        case 'show_10':
          responseMessage = await handleDateRange(chatId, 10);
          break;
      default:
        responseMessage = 'Unknown action!';
    }

    bot.answerCallbackQuery(callbackQuery.id);
    if (responseMessage !== undefined) {
      bot.sendMessage(chatId, escapeMarkdown(responseMessage), { parse_mode: 'MarkdownV2' });
    }

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

const handleDateRange = async (chatId, days) => {
  const today = moment().toDate();
  let startDate, endDate;

  if (userStates[chatId].step === 'show_past') {
    startDate = moment(today).subtract(days, 'days').toDate();
    endDate = today;
  } else if (userStates[chatId].step === 'show_future') {
    startDate = today;
    endDate = moment(today).add(days, 'days').toDate();
  } else {
    throw new Error('Unknown step');
  }

  const todos = await getTodos(chatId, mongoFormatDate(startDate), mongoFormatDate(endDate));
  const events = await getEvents(chatId, mongoFormatDate(startDate), mongoFormatDate(endDate));
  return `${todos || ''}\n\n\n${events || ''}`;
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

const setupNotification = async () => {
  try {
    const notifications = await Notification.find({ enabled: 'true' });
    if (!notifications) {
      console.error('No notification found for the given telegramId');
      return;
    }
    notifications.map(notification => {
      const [HOURS, MINUTES] = notification.time.split(':');
      schedule.scheduleJob(`${MINUTES} ${HOURS} * * *`, async () => {
        console.log(`Scheduled job running at ${HOURS}:${MINUTES}`);
        const users = await User.find({});
        for (const user of users) {
          const chatId = user.telegramId;
          const today = mongoFormatDate(new Date());
          const todos = await getTodos(chatId, today);
          const events = await getEvents(chatId, today);

          const responseMessage = `${todos}\n\n\n${events}`;
          bot.sendMessage(chatId, escapeMarkdown(responseMessage), { parse_mode: 'MarkdownV2' });
        }
      });
    })

  } catch (err) {
    console.error('Error setting up scheduled job:', err);
  }
};
