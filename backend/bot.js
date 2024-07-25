const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const { Todo, Event, User, Notification } = require('./models');
const { markupDays, markupDaily, markupRange, markupNotificationSettings } = require('./markup');
const { mongoFormatDate, handleDateRange, getEvents, getTodos, escapeMarkdown, setupNotification } = require('./utils');
const { query } = require('express');
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

// --- /start command ---
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    if (await User.findOne({ telegramId: chatId.toString() })) {
      bot.sendMessage(chatId, 'You can use the following commands:\n/plans_today - to see your plans for today\n/plans_date - to see your plans for a specific date\n/plans_range - to see your plans for a range of days\n/edit_notification_settings - changes settings of daily notification\n');
      return;
    }
    const user = new User({ telegramId: chatId.toString() });
    const notification = new Notification({ telegramId: chatId.toString(), time: '21:00', enabled: 'true' });
    await user.save();
    await notification.save();
    bot.sendMessage(chatId, 'Welcome!\n\nYou can use the following commands:\n\n/plans_today - to see your plans for today\n/plans_date - to see your plans for a specific date\n/plans_range - to see your plans for a range of days\n/edit_notification_settings - changes settings of daily notification\n');
  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while saving your Telegram ID.');
    console.error(err);
  }
});

// --- /plans_today command ---
bot.onText(/\/plans_today/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await User.findOne({ telegramId: chatId.toString() });

    bot.sendMessage(chatId, 'Choose what would you like to print:' + '\n\n', markupDaily);

  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while fetching your plans.');
    console.error(err);
  }
});

// --- /show_plans command ---
bot.onText(/\/plans_date/, async (msg) => {
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
bot.onText(/\/plans_range/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await User.findOne({ telegramId: chatId.toString() });

    bot.sendMessage(chatId, 'Would you like to print past or future plans?' + '\n\n', markupRange);

  } catch (err) {
    bot.sendMessage(chatId, 'An error occurred while fetching your plans.');
    console.error(err);
  }

});

// --- /edit_notification_settings command ---
bot.onText(/\/edit_notification_settings/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const notification = await Notification.findOne({ telegramId: chatId.toString() });
    let text = '';

    if (notification.enabled) {
      text = 'Turn off';
    } else if (!notification.enabled) {
      text = 'Turn on';
    } else {
      bot.sendMessage(chatId, 'An error occurred while fetching your notification settings.');
      return;
    }
    const markupNotification = markupNotificationSettings(notification.enabled);
    bot.sendMessage(chatId, 'Choose what would you like to change:' + '\n\n', markupNotification);

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
      else if (todos && !events) {
        responseMessage = `*${date}*\n\n__*To-Do's*__\n${todos}\n\n\n__*Events*__\nYou don't have any events for this day`;
      }
      else if (!todos && events){
        responseMessage = `*${date}*\n\n__*To-Do's*__\nYou don't have any to-do's for this day\n\n\n__*Events*__\n${events}`;
      }
      else {
        responseMessage = `*${date}*\n\n__*To-Do's*__\n${todos}\n\n\n__*Events*__\n${events}`;
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
  const messageId = callbackQuery.message.message_id;
  const action = callbackQuery.data;
  const today = mongoFormatDate(new Date());

  try {
    if (!userStates[chatId]) {
      userStates[chatId] = {};
    }

    let responseMessage;

    switch (action) {
      case 'notification_time':
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
        responseMessage = `__*Today's To-Do's*__:\n${responseMessage}`;
        break;
      case 'show_daily_events':
        responseMessage = await getEvents(chatId, today);
        if (!responseMessage) {
          responseMessage = 'No plans for today';
          break;
        }
        responseMessage = `__*Today's Events*__:\n${responseMessage}`;
        break;
      case 'show_daily_all':
        const todos = await getTodos(chatId, today)
        const events = await getEvents(chatId, today);
        if (!todos && !events) {
          responseMessage = 'No plans for today';
          break;
        }
        else if (!todos && events) {
          responseMessage = `__*Today's Events*__:\n${events}`;
          break;
        }
        else if (todos && !events) {
          responseMessage = `__*Today's To-do*__:\n${todos}`;
          break;
        }
        responseMessage = `__*Today's To-Do's*__:\n${todos}\n\n__*Today's Events*__:\n${events}`;

        break;
      case 'show_past':
      case 'show_future':
        userStates[chatId].step = action;
        bot.sendMessage(chatId, 'Choose the number of days:', markupDays);
        break;
      case 'show_3':
        responseMessage = await handleDateRange(chatId, 3, userStates[chatId].step);
        delete userStates[chatId];
        break;
      case 'show_5':
        responseMessage = await handleDateRange(chatId, 5, userStates[chatId].step);
        delete userStates[chatId];
        break;
      case 'show_7':
        responseMessage = await handleDateRange(chatId, 7, userStates[chatId].step);
        delete userStates[chatId];
        break;
      case 'show_10':
        responseMessage = await handleDateRange(chatId, 10, userStates[chatId].step);
        delete userStates[chatId];
        break;
      default:
        responseMessage = 'Unknown action!';
    }
    bot.deleteMessage(chatId, messageId)
        .then(() => {
            console.log('Message deleted');
        })
        .catch((err) => {
            console.error('Failed to delete message:', err);
        });

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


module.exports = bot;