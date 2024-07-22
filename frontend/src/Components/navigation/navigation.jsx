import React, { useEffect } from 'react';
import "./Navigation.css";
import Box from '@mui/material/Box';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Navigation({ passedValue, onNavigationChange }) {
  const [value, setValue] = React.useState(passedValue);
  const navigate = useNavigate();

  useEffect(() => {
    setValue(passedValue);
  }, [passedValue]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    onNavigationChange(newValue);
    navigate(`/${newValue}`);
  };

  return (
    <div className='navigation'>
      <Box sx={{ position: 'fixed', bottom: 5, zIndex: 1000, width: '95%', left: '50%', transform: 'translateX(-50%)'}}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={handleChange}
          sx={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', borderRadius: 5, '& .MuiBottomNavigationAction-label': {
            fontSize: 14,
          },}}
        >
          <BottomNavigationAction label="ToDo" value="" sx={{color:'var(--tg-theme-text-color)', fontWeight: 'bold',}}/>
          <BottomNavigationAction label="Events" value="events" sx={{color:'var(--tg-theme-text-color)', fontWeight: 'bold',}}/>
          <BottomNavigationAction label="Calendar" value="calendar" sx={{color:'var(--tg-theme-text-color)', fontWeight: 'bold', fontSize: 20}} />
        </BottomNavigation>
      </Box>
    </div>
  );
}

export default Navigation;
