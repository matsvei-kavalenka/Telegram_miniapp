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

const markupDaily = {
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

const markupRange = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'Past', callback_data: 'show_past' },
        { text: 'Future', callback_data: 'show_future' }
      ]
    ]
  }
};

const markupNotificationSettings = (enabled) => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Edit time', callback_data: enabled ? 'notification_time' : 'disabled_notification_time' },
        ],
        [
          { text: enabled ? 'Turn off' : 'Turn on', callback_data: 'turn_on_off' },
        ]
      ]
    }
  };
};

module.exports = {
  markupDays,
  markupDaily,
  markupRange,
  markupNotificationSettings
};