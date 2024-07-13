import React, { useEffect, useRef, useState } from 'react';
import './calendar.css';
import Calendar from 'react-calendar';
import TodoField from '../todoField/todoField';
import EventField from '../eventField/eventField';
import axios from 'axios';
import moment from 'moment';
import Button from '../Button/Button';
import { useNavigate } from 'react-router-dom';

function MainCalendar({userId}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todosCalendar, setTodosCalendar] = useState([]);
  const [eventsCalendar, setEventsCalendar] = useState([]);
  const eventsRef = useRef();
  const navigate = useNavigate();
  const currentDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  

  useEffect(() => {
    const getTodos = async (date) => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/todo`, {
          params: { userId }
        });
        const formattedDate = formatDateForMongo(date);
        const foundData = response.data.find((block) => block.date === formattedDate);

        if (foundData) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          date.setHours(0, 0, 0, 0);

          if (date < today) {
            const filteredTodos = foundData.todos.filter((todo) => todo.checked);
            setTodosCalendar(filteredTodos);
          } else {
            setTodosCalendar(foundData.todos);
          }
        } else {
          setTodosCalendar([]);
        }
      } catch (error) {
        console.error('Error fetching todos:', error);
        setTodosCalendar([]);
      }
    };

    const getEvents = async (date) => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/events`, {
          params: { userId }
        });
        const formattedDate = formatDateForMongo(date);
        const foundData = response.data.find((block) => block.date === formattedDate);
        if (foundData) {
          setEventsCalendar(foundData.events);
        } else {
          setEventsCalendar([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEventsCalendar([]);
      }
    };

    getTodos(selectedDate);
    getEvents(selectedDate);
  }, [selectedDate, userId]);

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
          {todosCalendar
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
          {todosCalendar.length === 0 && selectedDate >= currentDate() && (
            <Button type='goTo' text='Add a todo' onClick={handleGoToTodo} />
          )}
          {todosCalendar.length === 0 && currentDate() > selectedDate && <h3>Empty</h3>}
          <h2>Events</h2>
          {eventsCalendar
            .sort((a, b) => moment(a.time).valueOf() - moment(b.time).valueOf())
            .map((field) => (
              <EventField
                key={field.id}
                id={field.id}
                text={field.text}
                onChangeInput={handleChangeInput}
                onDelete={() => handleDelete(field.id)}
                onSave={() => handleSave(field.id)}
                timeValue={moment(field.time)}
                disabled={true}
                navigate={handleGoToEvents}
                deleteDisabled={true}
              />
            ))}
          {eventsCalendar.length === 0 && (
            <Button type='goTo' text='Add an event' onClick={handleGoToEvents} />
          )}
        </div>
      </div>
    </div>
  );
}

export default MainCalendar;
