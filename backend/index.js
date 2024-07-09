const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

async function connectDB() {
  try {
    await mongoose.connect(`${MONGODB_URI}`, {
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
  date: String,
  events: [
    {
      id: String,
      time: String,
      text: String,
      
    }
  ]
})

const Todo = mongoose.model("Todo", todoSchema);
const Event = mongoose.model("Event", eventSchema)

app.get('/api/todo', async (req, res) => {
  try {
    const data = await Todo.find(); 
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const data = await Event.find();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});


app.post("/", async (req, res) => {
  try {
    const { formattedDate, filteredTodos } = req.body;
    console.log(filteredTodos)

    const [day, month, year] = formattedDate.split('/');
    const dateFormattedForMongo = `${day}-${month}-${year}`;

    const existingTodo = await Todo.findOne({ date: dateFormattedForMongo });

    if (existingTodo) {
      existingTodo.todos = filteredTodos.map(todo => ({
        id: todo.id,
        text: todo.text,
        checked: todo.checked
      }));
      const updatedTodo = await existingTodo.save();
      res.json(updatedTodo.toObject());
      console.log('Todo updated:', updatedTodo);
    } else {
      const newTodo = new Todo({
        date: dateFormattedForMongo,
        todos: filteredTodos.map(todo => ({
          id: todo.id,
          text: todo.text,
          checked: todo.checked
        }))
      });

      const savedTodo = await newTodo.save();
      res.json(savedTodo.toObject());
      console.log('New todo created:', savedTodo);
    }
  } catch (e) {
    console.error(e);
    res.status(500).send("Something Went Wrong");
  }
});

app.post("/event", async (req, res) => {
  try {
    const { formattedDate, events } = req.body;

    const [day, month, year] = formattedDate.split('/');
    const dateFormattedForMongo = `${day}-${month}-${year}`;

    const existingEvent = await Event.findOne({ date: dateFormattedForMongo });
    console.log(events, dateFormattedForMongo)

    if (existingEvent) {
      existingEvent.events = events.map(event => ({
        id: event.id,
        time: event.time,
        text: event.text
      }));
      const updatedEvent = await existingEvent.save();
      res.json(updatedEvent.toObject());
      console.log('Event updated:', updatedEvent);
    } else {
      const newEvent = new Event({
        date: dateFormattedForMongo,
        events: events.map(event => ({
          id: event.id,
          time: event.time,
          text: event.text,
        }))
      });

      const savedEvent = await newEvent.save();
      res.json(savedEvent.toObject());
      console.log('New event created:', savedEvent);
    }
  } catch (e) {
    console.error(e);
    res.status(500).send("Something Went Wrong");
  }
});

app.listen(PORT, () => {
  console.log("Server is running on port 5000");
});
