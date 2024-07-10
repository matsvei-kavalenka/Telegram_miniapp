import React from 'react';
import PropTypes from 'prop-types';
import "./eventField.css";
import CustomTimePicker from '../CustomTimePicker/timepicker';
import deleteIcon from '../../img/deleteIcon.png';
import editIcon from '../../img/editIcon.png'
import Button from '../Button/Button';

function EventField({ id, text, onChangeInput, onDelete, onEdit, onSave, timeValue, disabled, navigate, deleteDisabled, onTimeChange }) {
  const handleInputChange = (e) => {
    onChangeInput(id, e.target.value);
  };

  return (
    <div className="form-row-event">
      <CustomTimePicker id={`time-${id}`} disabled={disabled} value={timeValue} onChange={() => onTimeChange(id)}  />
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
        <Button type="save" onClick={() => onSave(id)} text='Save' alt="Save" />
      ) : (
        <div>
          <Button type="edit" onClick={() => navigate ? navigate() : onEdit(id)} img={editIcon} alt="Edit"  />
          <Button type="delete" onClick={() => onDelete(id)} img={deleteIcon} alt="Delete" disabled={deleteDisabled} />
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
};

export default EventField;
