import React,{ useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import "./EventsPage.css";
import CustomTimePicker from '../../CustomTimePicker/timepicker';
import Button from '../../Button/Button';
import DatePanel from '../../DatePanel/DatePanel';
import EventField from '../../EventField/EventField';
import moment from 'moment';
import axios from "axios";
import CryptoJS, { AES } from 'crypto-js';  

function Events({ userId, onNavigationChange }) {
  const location = useLocation();
  const secretKey = process.env.REACT_APP_SECRET_KEY;
  const { dateCalendar } = location.state || {};
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState([]);
  const [events, setEvents] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [timeValue, setTimeValue] = useState(moment());
  const currentDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  useEffect(() => {
    if (dateCalendar && !isNaN(new Date(dateCalendar))) {
      setSelectedDate(new Date(dateCalendar));
    }
  }, [dateCalendar]);

  useEffect(() => {
    onNavigationChange('events');
  }, [onNavigationChange]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/events`, {
          params: { userId }
        });
        setData(response.data);
        retrieveEvents(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const formattedDate = formatDateForMongo(selectedDate);
    const foundData = data.find(block => block.date === formattedDate);
    if (foundData) {
      const decryptedEvents = decryptData(foundData.events);
      setEvents(decryptedEvents);
    } else {
      setEvents([]);
    }
    // eslint-disable-next-line
  }, [selectedDate, data]);

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  };

  const decryptData = (encryptedData) => {
    const decryptedData = AES.decrypt(encryptedData, secretKey).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  };

  const handleAddField = () => {
    if (inputValue.trim() === '') return;
    const newEvent = { id: Math.random().toString(16).slice(2), text: inputValue, time: timeValue, disabled: true };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    setInputValue('');
    setTimeValue(moment());
    handleOnSubmit(updatedEvents);
  };

  const handleOnSubmit = async (events) => {
    const formattedDate = formatDate(selectedDate);
    const encryptedEvents = encryptData(events);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/event`, {
        method: "POST",
        body: JSON.stringify({ userId, formattedDate, encryptedEvents }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.warn(result);

    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleTimeChange = (value) => {
    setTimeValue(value);
  };

  const handleChangeInput = (id, value) => {
    const updatedFields = events.map((field) =>
      field.id === id ? { ...field, text: value } : field
    );
    setEvents(updatedFields);
  };

  const handleDateChange = (date) => {
    if (date && !isNaN(new Date(date))) {
      setSelectedDate(new Date(date));
    }
  };

  const handleLeftArrowClick = () => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleRightArrowClick = () => {
    setSelectedDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const retrieveEvents = (data) => {
    const formattedDate = formatDateForMongo(selectedDate);
    const foundData = data.find(block => block.date === formattedDate);
    if (foundData) {
      const decryptedEvents = decryptData(foundData.events);
      setEvents(decryptedEvents);
    } else {
      setEvents([]);
    }
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForMongo = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleEditMode = (id) => {
    const updatedEvents = events.map((field) =>
      field.id === id ? { ...field, disabled: false } : field
    );
    setEvents(updatedEvents);
  };

  const handleSaveField = (id) => {
    const updatedEvents = events.map((field) =>
      field.id === id ? { ...field, disabled: true } : field
    );
    setEvents(updatedEvents);
    handleOnSubmit(updatedEvents);
  };

  const handleDeleteField = (id) => {
    const updatedEvents = events.filter((field) => field.id !== id);
    setEvents(updatedEvents);
    handleOnSubmit(updatedEvents);
  };

  const handleChange = (id, value) => {
    const updatedEvents = events.map((field) =>
      field.id === id ? { ...field, time: value } : field
    );
    setEvents(updatedEvents);
  };

  return (
    <>
      <DatePanel
        selectedDate={selectedDate}
        handleLeftArrowClick={handleLeftArrowClick}
        handleRightArrowClick={handleRightArrowClick}
        handleDateChange={handleDateChange}
        startDate=''
      />
      <div className='main-div'>
        <div className='creation-container'>
          <CustomTimePicker id='timepicker' value={timeValue} disabled={selectedDate <= currentDate()} onChange={handleTimeChange} />
          <input 
            id='event' 
            type='text' 
            className='eventInput'
            placeholder='Event' 
            value={inputValue} 
            onChange={handleInputChange} 
            disabled={selectedDate <= currentDate()}
            autoComplete="off"
          />
          <Button className='createEvent' disabled={selectedDate <= currentDate() } onClick={handleAddField}> Create Event </Button>
        </div>
        <div className='scrollable-event-div'>
          {Array.isArray(events) && events.sort((a, b) => moment(a.time).valueOf() - moment(b.time).valueOf())
            .map((field) => (
              <EventField
                key={field.id}
                id={field.id}
                text={field.text}
                onChangeInput={handleChangeInput}
                onDelete={handleDeleteField}
                onEdit={handleEditMode}
                onSave={handleSaveField}
                timeValue={moment(field.time)}
                onTimeChange={handleChange}
                disabled={field.disabled === undefined || field.disabled === null ? true : field.disabled}
              />
            ))}
        </div>
      </div>
    </>
  );
}

export default Events;
