import React, { useEffect, useRef, useState } from 'react';
import './calendar.css';
import Calendar from 'react-calendar';
import TodoField from '../todoField/todoField';
import EventField from '../eventField/eventField';
import axios from 'axios';
import moment from 'moment';
import Button from '../Button/Button';
import { useNavigate } from 'react-router-dom';

function MainCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [events, setEvents] = useState([]);
  const eventsRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const getTodos = async (date) => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/todo`);
        const formattedDate = formatDateForMongo(date);
        const foundData = response.data.find((block) => block.date === formattedDate);

        if (foundData) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          date.setHours(0, 0, 0, 0);

          if (date < today) {
            const filteredTodos = foundData.todos.filter((todo) => todo.checked);
            setTodos(filteredTodos);
          } else {
            setTodos(foundData.todos);
          }
        } else {
          setTodos([]);
        }
      } catch (error) {
        console.error('Error fetching todos:', error);
        setTodos([]);
      }
    };

    const getEvents = async (date) => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/events`);
        const formattedDate = formatDateForMongo(date);
        const foundData = response.data.find((block) => block.date === formattedDate);
        if (foundData) {
          setEvents(foundData.events);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };

    getTodos(selectedDate);
    getEvents(selectedDate);
  }, [selectedDate]);

  const handleCalendarClick = (date) => {
    eventsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setSelectedDate(date);
  };

  const formatDateForMongo = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleGoToEvents = () => {
    navigate('/events', { state: { dateCalendar: selectedDate } });
  };

  const handleGoToTodo = () => {
    navigate('/', { state: { dateCalendar: selectedDate } });
  };

  const handleDelete = (id) => {
  };

  const handleSave = (id) => {
  };

  const handleChangeInput = (id, value) => {
  };

  return (
    <div className='main'>
      <Calendar minDetail='decade' prev2Label='' next2Label='' onChange={handleCalendarClick} />
      <div className='scrollable-calendar-div'>
        <div className='calendar-events-div' ref={eventsRef}>
          <h2>Todos</h2>
          {todos
            .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1))
            .map((todo, index) => (
              <TodoField
                id={todo.id}
                key={index}
                checked={todo.checked}
                text={todo.text}
                disableAll={true}
              />
            ))}
          {todos.length === 0 && selectedDate >= new Date() && (
            <Button type='goTo' text='Add a todo' onClick={handleGoToTodo} />
          )}
          {todos.length === 0 && selectedDate <= new Date() && <h3>Empty</h3>}
          <h2>Events</h2>
          {events
            .sort((a, b) => moment(a.time).valueOf() - moment(b.time).valueOf())
            .map((field) => (
              <EventField
                key={field.id}
                id={field.id}
                text={field.text}
                onChangeInput={handleChangeInput}
                onDelete={() => handleDelete(field.id)}
                onSave={() => handleSave(field.id)}
                editModeState={false}
                timeValue={moment(field.time)}
                disabled={true}
                disabledAll={true}
                navigate={handleGoToEvents}
              />
            ))}
          {events.length === 0 && (
            <Button type='goTo' text='Add an event' onClick={handleGoToEvents} />
          )}
        </div>
      </div>
    </div>
  );
}

export default MainCalendar;
