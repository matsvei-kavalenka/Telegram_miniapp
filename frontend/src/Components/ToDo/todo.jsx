import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './todo.css';
import Button from '../Button/Button';
import plus from '../../img/plus.png';
import TodoField from '../todoField/todoField';
import axios from 'axios';
import DatePanel from '../DatePanel/DatePanel';
import OutsideClicker from '../OutsideClick/OutsideClick';

function Todo() {
  const location = useLocation();
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
    retrievePendingTodos(data);
    retrieveTodos(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, data]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/todo`);
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
  

  const handleKeyDown = (event, id) => {
    if (event.key === 'Enter') {
      const inputElement = document.getElementById(`text-${id}`);
      if (inputElement) {
        inputElement.blur();
      }
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
    if (todos.length === 0){
      return;
    }
    const filteredTodos = todos.filter(x => x.text.length !== 0);
    
    try {
      const response = await fetch('http://localhost:5000/', {
        method: 'POST',
        body: JSON.stringify({ formattedDate, filteredTodos }),
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
    setTodos([]);
    const formattedDate = formatDateForMongo(selectedDate);
    const foundData = data.find((block) => block.date === formattedDate);
    if (foundData) {
      setTodos(foundData.todos);
    }
  };

  const retrievePendingTodos = (data) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);
    
    const formattedDate = formatDateForMongo(newDate);
    const foundData = data.find((block) => block.date === formattedDate);
    if (foundData) {
      const todos = foundData.todos;
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
    setTodos(todos.concat({ id: todos.length, text: '', checked: false }));
  };

  const handleDelete = (id) => {
    const updatedTodos = todos.filter((field) => field.id !== id);
    setTodos(updatedTodos);
    handleOnSubmit(updatedTodos, selectedDate);
  };

  const handlePendingDelete = (id) => {
    const updatedPendingTodos = pendingTodos.filter((field) => field.id !== id);
    setPendingTodos(updatedPendingTodos);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);
    handleOnSubmit(updatedPendingTodos, newDate);
  };

  return (
    <div>
      <DatePanel
        selectedDate={selectedDate}
        handleLeftArrowClick={handleLeftArrowClick}
        handleRightArrowClick={handleRightArrowClick}
        handleDateChange={handleDateChange}
        disabled={btnStateDisabled}
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

            
            {todos.sort((a, b) => (a.checked === b.checked)? 0 : a.checked? 1 : -1).map((todo, index) => (
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
          <Button type='plus' onClick={AddOnBtnClick} img={plus} alt='Plus' />
        </div>
      </div>
    </div>
  );
}

export default Todo;
