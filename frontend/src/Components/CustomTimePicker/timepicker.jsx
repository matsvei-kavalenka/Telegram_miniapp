import React from 'react';
import "./timepicker.css"
import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';

function CustomTimePicker({id, value, onChange, disabled}) {
  return (
    <TimePicker
      id={id}
      className='timepicker'
      format="HH:mm"
      showSecond={false}
      allowEmpty={false}
      disabled={disabled}
      defaultValue={moment()}
      value={value}
      onChange={onChange}
    />
  );
}

export default CustomTimePicker;
