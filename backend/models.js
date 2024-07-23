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

const Todo = mongoose.model("Todo", todoSchema);
const Event = mongoose.model("Event", eventSchema);
const User = mongoose.model('User', userSchema);

module.exports = { Todo, Event, User };
