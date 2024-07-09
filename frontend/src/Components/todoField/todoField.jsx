import React, { useEffect, useState } from 'react';
import "./todoField.css";
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
        className={`${done ? 'done' : ''}`}
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
      <Button id={`delete-${id}`} type="deleteTodo" onClick={() => onDelete(id)} img={deleteIcon} alt="Delete Todo" disabled={disableAll}/>
    </div>
  );
}

export default TodoField;
