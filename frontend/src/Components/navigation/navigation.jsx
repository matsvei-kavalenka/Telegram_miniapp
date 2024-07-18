import React from 'react';
import "./navigation.css";
import Box from '@mui/material/Box';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Navigation() {
  const [value, setValue] = React.useState('');
  const navigate = useNavigate();

  return (
    <div className='navigation'>
      <Box sx={{ position: 'fixed', bottom: 5, zIndex: 1000, width: '95%', left: '50%', transform: 'translateX(-50%)'}}>
        <BottomNavigation
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            navigate(`/${newValue}`);
          }}
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
