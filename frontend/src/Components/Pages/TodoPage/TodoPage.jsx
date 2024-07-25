import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './TodoPage.css';
import Button from '../../Button/Button';
import plus from '../../../img/plus.png';
import TodoField from '../../TodoField/TodoField';
import axios from 'axios';
import DatePanel from '../../DatePanel/DatePanel';
import OutsideClicker from '../../OutsideClick/OutsideClick';
import CryptoJS, { AES } from 'crypto-js';

function Todo({ userId, onNavigationChange }) {
  const location = useLocation();
  const secretKey = process.env.REACT_APP_SECRET_KEY;
  const { dateCalendar } = location.state || {};
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState([]);
  const [pendingTodos, setPendingTodos] = useState([]);
  const [data, setData] = useState([]);
  const [btnStateDisabled, setBtnStateDisabled] = useState(false);
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  useEffect(() => {
    setSelectedDate(dateCalendar ? new Date(dateCalendar) : new Date());
  }, [dateCalendar]);

  useEffect(() => {
    onNavigationChange('');
  }, [onNavigationChange]);

  useEffect(() => {
    retrievePendingTodos(data);
    retrieveTodos(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, data]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/todo`, {
          params: { userId }
        });
        setData(response.data);
        retrieveTodos(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    const formattedDate = formatDate(selectedDate);
    const currentDate = formatDate(new Date());

    if (formattedDate === currentDate) {
      setBtnStateDisabled(true);
    } else {
      setBtnStateDisabled(false);
    }
  }, [selectedDate]);

  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  };

  const decryptData = (encryptedData) => {
    const decryptedData = AES.decrypt(encryptedData, secretKey).toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  };

  const handleKeyDown = (event, id) => {
    if (event.key === 'Enter') {
      handleOnSubmit(todos, selectedDate);
      AddOnBtnClick();
    }
  };

  const handleCheckChange = (index) => {
    const updatedTodos = todos.map((todo, idx) =>
      idx === index ? { ...todo, checked: !todo.checked } : todo
    );
    setTodos(updatedTodos);
    handleOnSubmit(updatedTodos, selectedDate)
  };

  const handlePendingCheckChange = (index) => {
    const updatedPendingTodos = pendingTodos.map((todo, idx) =>
      idx === index ? { ...todo, checked: !todo.checked } : todo
    );
    updatedPendingTodos.filter(todo => todo.checked === false);
    setPendingTodos(updatedPendingTodos);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);
    handleOnSubmit(updatedPendingTodos, newDate);
  };

  const handleToDoChange = (index, value) => {
    const updatedTodos = todos.map((todo, idx) =>
      idx === index ? { ...todo, text: value } : todo
    );
    setTodos(updatedTodos);
  };

  const handlePendingToDoChange = (index, value) => {
    const updatedPendingTodos = pendingTodos.map((pendingTodo, idx) =>
      idx === index ? { ...pendingTodo, text: value } : pendingTodo
    );
    setPendingTodos(updatedPendingTodos);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleLeftArrowClick = () => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleRightArrowClick = () => {
    setSelectedDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const handleOnSubmit = async (todos, date) => {
    const formattedDate = formatDate(date);
    if (todos.length === 0) {
      return;
    }
    const filteredTodos = todos.filter(x => x.text.length !== 0);
    const encryptedTodos = encryptData(filteredTodos);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}`, {
        method: 'POST',
        body: JSON.stringify({ userId, formattedDate, encryptedTodos }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      if (result) {
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    }
  };

  const retrieveTodos = (data) => {
    const formattedDate = formatDateForMongo(selectedDate);
    const foundData = data.find((block) => block.date === formattedDate);
    if (foundData) {
      const decryptedData = decryptData(foundData.todos);
      setTodos(decryptedData);
    }
    else {
      setTodos([]);
    }
  };

  const retrievePendingTodos = (data) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);

    const formattedDate = formatDateForMongo(newDate);
    const foundData = data.find((block) => block.date === formattedDate);
    if (foundData) {
      const todos = decryptData(foundData.todos);
      const filteredTodos = todos.filter(x => x.checked === false);
      setPendingTodos(filteredTodos);
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForMongo = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const AddOnBtnClick = () => {
    if (todos.length === 0) {
      setTodos([{ id: 0, text: '', checked: false }]);
      return;
    }
    const inputElement = document.getElementById(`text-${todos.length - 1}`);
    console.log(inputElement.value.trim());
    if (inputElement.value.trim() !== '') {
      setTodos(prevTodos => {
        const newTodos = prevTodos.concat({ id: prevTodos.length, text: '', checked: false });
        setTimeout(() => {
          const inputElement = document.getElementById(`text-${prevTodos.length}`);
          if (inputElement) {
            inputElement.focus();
          }
        }, 0);
        return newTodos;
      });
    }


  };

  const handleDelete = (id) => {
    const updatedTodos = todos.filter((field) => field.id !== id);
    setTodos(updatedTodos);
    handleOnSubmit(updatedTodos, selectedDate);
  };

  const handlePendingDelete = (id) => {
    const updatedPendingTodos = pendingTodos.map((pendingTodo, idx) =>
      idx === id ? { ...pendingTodo, checked: true } : pendingTodo
    );
    setPendingTodos(updatedPendingTodos);
    setPendingTodos(updatedPendingTodos);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);
    handleOnSubmit(updatedPendingTodos, newDate);
  };

  return (
    <>
      <DatePanel
        selectedDate={selectedDate}
        handleLeftArrowClick={handleLeftArrowClick}
        handleRightArrowClick={handleRightArrowClick}
        handleDateChange={handleDateChange}
        disabled={btnStateDisabled}
        startDate={new Date()}
      />
      <div className='main-div'>
        <div className='scrollable-div'>

          <OutsideClicker onOutsideClick={() => handleOnSubmit(todos, selectedDate)}>
            {pendingTodos.length !== 0 && isToday(selectedDate) && (
              <>
                <h3>Pending</h3>
                {pendingTodos.map((pendingTodo, index) => (
                  <TodoField
                    id={pendingTodo.id}
                    key={index}
                    checked={pendingTodo.checked}
                    text={pendingTodo.text}
                    onChangeCheckbox={() => handlePendingCheckChange(index)}
                    onChangeInput={(e) => handlePendingToDoChange(index, e.target.value)}
                    onDelete={handlePendingDelete}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  />
                ))}
                <hr className='separator' />
              </>
            )}


            {todos.sort((a, b) => (a.checked === b.checked) ? 0 : a.checked ? 1 : -1).map((todo, index) => (
              <TodoField
                id={todo.id}
                key={index}
                checked={todo.checked}
                text={todo.text}
                onChangeCheckbox={() => handleCheckChange(index)}
                onChangeInput={(e) => handleToDoChange(index, e.target.value)}
                onDelete={handleDelete}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </OutsideClicker>

        </div>
        <div className='div-sticky'>
          <Button className='plus' onClick={AddOnBtnClick}>
            <img src={plus} alt='plus' />
          </Button>
        </div>
      </div>
    </>
  );
}

export default Todo;
