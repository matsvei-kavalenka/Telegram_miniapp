import React, {useState} from 'react';
import { Route, Routes } from 'react-router-dom';
import ToDo from './Components/Pages/TodoPage/TodoPage';
import Events from './Components/Pages/EventsPage/EventsPage';
import Calendar from './Components/Pages/CalendarPage/CalendarPage';
import Navigation from './Components/Navigation/Navigation';

function AppRoutes ({userId}) {
  const [value, setValue] = useState('');

  const handleNavigationChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <>
    <Navigation passedValue={value} onNavigationChange={handleNavigationChange} />
    <Routes>
      <Route key="todo" path="/" element={<ToDo userId={userId} onNavigationChange={handleNavigationChange} />} />
      <Route key="events" path="/events" element={<Events userId={userId} onNavigationChange={handleNavigationChange} />} />
      <Route key="calendar" path="/calendar" element={<Calendar userId={userId} onNavigationChange={handleNavigationChange} />} />
    </Routes>
  </>
  );

  
};

export default AppRoutes;
