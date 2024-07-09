import React from 'react';
import "./navigation.css";
import Box from '@mui/material/Box';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Navigation() {
  const [value, setValue] = React.useState('todo');
  const navigate = useNavigate();

  return (
    <div className='navigation'>
      <Box sx={{ width: "100%", position: 'fixed', bottom: 0 }}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          navigate(`/${newValue}`);
        }}
      >
        <BottomNavigationAction label="ToDo" value="" />
        <BottomNavigationAction label="Events" value="events" />
        <BottomNavigationAction label="Calendar" value="calendar" />
      </BottomNavigation>
      </Box>
    </div>
    
  );
}

export default Navigation;
