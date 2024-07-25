import React from 'react';
import PropTypes from 'prop-types';
import "./EventField.css";
import CustomTimePicker from '../CustomTimePicker/timepicker';
import deleteIcon from '../../img/deleteIcon.png';
import editIcon from '../../img/editIcon.png'
import Button from '../Button/Button';

function EventField({ id, text, onChangeInput, onDelete, onEdit, onSave, timeValue, disabled, navigate, deleteDisabled, onTimeChange }) {
  const handleInputChange = (e) => {
    onChangeInput(id, e.target.value);
  };

  const handleTimeChange = (value) => {
    console.log(id, value)
    onTimeChange(id, value);
  };

  return (
    <div className="form-row-event">
      <CustomTimePicker id={`event-${id}`} disabled={disabled} value={timeValue} onChange={handleTimeChange} />
      <input
        id={`event-${id}`}
        type="text"
        className="event-field"
        name='eventField'
        value={text}
        onChange={handleInputChange}
        readOnly={disabled}
        autoComplete="off"
      />

      {!disabled ? (
        <Button className="save" onClick={() => onSave(id)}> Save </Button>
      ) : (
        <div>
          <Button className="edit" onClick={() => navigate ? navigate() : onEdit(id)}>
            <img src={editIcon} alt="Edit" />
          </Button>
          <Button className="delete" onClick={() => onDelete(id)} disabled={deleteDisabled} >
            <img src={deleteIcon} alt="Delete" />
          </Button>
        </div>
      )}
    </div>
  );
}

EventField.propTypes = {
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  timeValue: PropTypes.object.isRequired,
  onChangeInput: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onSave: PropTypes.func,
  disabled: PropTypes.bool,
  navigate: PropTypes.func,
  deleteDisabled: PropTypes.bool,
  onTimeChange: PropTypes.func,
};

export default EventField;
