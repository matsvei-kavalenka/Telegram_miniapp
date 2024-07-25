const mongoose = require('mongoose');
const todoSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  todos: { type: String, required: true },
});

const eventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  events: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
});

const notificationSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  time: { type: String, required: true },
  enabled: { type: Boolean, required: true }
});

const Todo = mongoose.model("Todo", todoSchema);
const Event = mongoose.model("Event", eventSchema);
const User = mongoose.model('User', userSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Todo, Event, User, Notification };
