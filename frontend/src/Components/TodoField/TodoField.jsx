import React, { useEffect, useState } from 'react';
import "./TodoField.css";
import Button from '../Button/Button';
import deleteIcon from '../../img/deleteIcon.png';

function TodoField({ id, checked, text, onChangeCheckbox, onChangeInput, onDelete, onKeyDown, disableAll }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(checked);
  }, [checked]);

  return (
    <div className="form-row">
      <input
        id={`checkbox-${id}`}
        className={`todoCheckbox ${done ? 'done' : ''}`}
        type="checkbox"
        checked={checked}
        onChange={onChangeCheckbox}
        disabled={disableAll}
      />
      <input
        id={`text-${id}`}
        type="text"
        className={`todoInput ${done ? 'done' : ''}`}
        value={text}
        onChange={onChangeInput}
        placeholder='to do'
        readOnly={checked}
        onKeyDown={(e) => onKeyDown(e, id)}
        autoComplete="off"
        disabled={disableAll}
      />
      <Button id={`delete-${id}`} className="deleteTodo" onClick={() => onDelete(id)} disabled={disableAll}>
        <img src={deleteIcon} alt="Delete Todo" />
      </Button>
    </div>
  );
}

export default TodoField;
