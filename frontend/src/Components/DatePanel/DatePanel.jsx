import React from 'react';
import PropTypes from 'prop-types';
import "./DatePanel.css";
import Button from '../Button/Button';
import leftArrow from '../../img/left-arrow.png';
import rightArrow from '../../img/right-arrow.png';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import calendarIcon from '../../img/calendarIcon.png'; 

function DatePanel({ selectedDate, handleLeftArrowClick, handleRightArrowClick, handleDateChange, disabled, startDate }) {
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const additionalContent = (date) => {
    const formattedDate = formatDate(date);
    const currentDate = new Date();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(currentDate.getDate() + 1);

    if (formattedDate === formatDate(currentDate)) {
      return <span>Today</span>;
    } else if (formattedDate === formatDate(tomorrowDate)) {
      return <span>Tomorrow</span>;
    } else {
      return formattedDate;
    }
  };

  return (
      <div className='date-main-div'>
        <Button className="left arrow" onClick={handleLeftArrowClick} disabled={disabled}>
          <img src={leftArrow} alt="Left arrow"/>
        </Button>
        <div className='date-input-container'>
          <h1 className='day-h1'>
            {additionalContent(selectedDate)}
          </h1>
          <DatePicker
            selected={selectedDate}
            minDate={startDate}
            onChange={handleDateChange}
            calendarStartDay={1}
            formatWeekDay={nameOfDay => nameOfDay.substr(0,3)}
            customInput={
              <Button className="date" >
                <img src={calendarIcon} alt="Calendar Icon"/>
              </Button>
            }
          />
        </div>
        <Button className="right arrow" onClick={handleRightArrowClick}>
          <img src={rightArrow} alt="Right arrow"/>
        </Button>
      </div>
  );
}

DatePanel.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  handleLeftArrowClick: PropTypes.func.isRequired,
  handleRightArrowClick: PropTypes.func.isRequired,
  handleDateChange: PropTypes.func.isRequired
};

export default DatePanel;
