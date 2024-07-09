import React from 'react';
import PropTypes from 'prop-types';
import "./eventField.css";
import CustomTimePicker from '../CustomTimePicker/timepicker';
import deleteIcon from '../../img/deleteIcon.png';
import editIcon from '../../img/editIcon.png'
import Button from '../Button/Button';

function EventField({ id, text, onChangeInput, onDelete, onEdit, editModeState, onSave, timeValue, disabled, disabledAll, navigate }) {
  const handleInputChange = (e) => {
    if (!disabledAll) {
      onChangeInput(id, e.target.value);
    }
  };

  return (
    <div className="form-row-event">
      <CustomTimePicker disabled={disabled || disabledAll} value={timeValue} />
      <input
        id={`event-${id}`}
        type="text"
        className="event-field"
        name='eventField'
        value={text}
        onChange={handleInputChange}
        readOnly={!editModeState}
        autoComplete="off"
        disabled={disabledAll}
      />

      {editModeState ? (
        <Button type="save" onClick={() => !disabledAll && onSave(id)} text='Save' alt="Save" disabled={disabledAll} />
      ) : (
        <div>
          <Button type="edit" onClick={() => !disabledAll ? onEdit(id) : navigate()} img={editIcon} alt="Edit"  />
          <Button type="delete" onClick={() => !disabledAll && onDelete(id)} img={deleteIcon} alt="Delete" disabled={disabledAll} />
        </div>
      )}
    </div>
  );
}

EventField.propTypes = {
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  onChangeInput: PropTypes.func,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onSave: PropTypes.func,
  editModeState: PropTypes.bool,
  timeValue: PropTypes.object,
  disabled: PropTypes.bool,
  disabledAll: PropTypes.bool,
};

export default EventField;
