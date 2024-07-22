import React from 'react';
import './Alert.css';
import Button from '../Button/Button';

function Alert({ hide, onClick1, onClick2, title, message }) {
  if (hide) return null;

  return (
    <>
      <div className="alert-overlay"></div>
      <div className="alert-container">
        <h4 className='alertH'>{message}</h4>
        <Button className='alertButton' onClick={onClick1} style={{ left: '20px' }}>Yes</Button>
        <Button className='alertButton' onClick={onClick2} style={{ right: '20px' }}>No</Button>
      </div>
    </>
  );
}

export default Alert;
