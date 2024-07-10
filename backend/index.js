const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

const app = express();

app.use(express.json());

const corsOptions = {
  origin: FRONTEND_URL, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to mini-app-tg database');
  } catch (err) {
    console.error('Error connecting to the database', err);
  }
}

connectDB();



const todoSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: String,
  todos: [
    {
      id: Number,
      text: String,
      checked: Boolean
    }
  ],
});

const eventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: String,
  events: [
    {
      id: String,
      time: String,
      text: String,
    }
  ]
});

const Todo = mongoose.model("Todo", todoSchema);
const Event = mongoose.model("Event", eventSchema);

app.get('/api/todo', async (req, res) => {
  const userId = req.query.userId;
  try {
    const data = await Todo.find({ userId: userId });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/events', async (req, res) => {
  const userId = req.query.userId;
  try {
    const data = await Event.find({ userId: userId });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post("/", async (req, res) => {
  try {
    const { userId, formattedDate, filteredTodos } = req.body;
    const [day, month, year] = formattedDate.split('/');
    const dateFormattedForMongo = `${day}-${month}-${year}`;

    const existingTodo = await Todo.findOne({ userId, date: dateFormattedForMongo });

    if (existingTodo) {
      existingTodo.todos = filteredTodos.map(todo => ({
        id: todo.id,
        text: todo.text,
        checked: todo.checked
      }));
      const updatedTodo = await existingTodo.save();
      res.json(updatedTodo.toObject());
    } else {
      const newTodo = new Todo({
        userId,
        date: dateFormattedForMongo,
        todos: filteredTodos.map(todo => ({
          id: todo.id,
          text: todo.text,
          checked: todo.checked
        }))
      });

      const savedTodo = await newTodo.save();
      res.json(savedTodo.toObject());
    }
  } catch (e) {
    console.error(e);
    res.status(500).send("Something Went Wrong");
  }
});

app.post("/event", async (req, res) => {
  try {
    const { userId, formattedDate, events } = req.body;
    const [day, month, year] = formattedDate.split('/');
    const dateFormattedForMongo = `${day}-${month}-${year}`;

    const existingEvent = await Event.findOne({ userId, date: dateFormattedForMongo });

    if (existingEvent) {
      existingEvent.events = events.map(event => ({
        id: event.id,
        time: event.time,
        text: event.text
      }));
      const updatedEvent = await existingEvent.save();
      res.json(updatedEvent.toObject());
    } else {
      const newEvent = new Event({
        userId: userId,
        date: dateFormattedForMongo,
        events: events.map(event => ({
          id: event.id,
          time: event.time,
          text: event.text,
        }))
      });

      const savedEvent = await newEvent.save();
      res.json(savedEvent.toObject());
    }
  } catch (e) {
    console.error(e);
    res.status(500).send("Something Went Wrong");
  }
});

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
