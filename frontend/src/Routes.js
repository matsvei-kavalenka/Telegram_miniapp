import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ToDo from './Components/ToDo/todo';
import Events from './Components/events/events';
import Calendar from './Components/calendar/calendar';
import Navigation from './Components/navigation/navigation';

const AppRoutes = ({userId}) => (
  <>
    <Navigation />
    <Routes>
      <Route key="todo" path="/" element={<ToDo userId={userId} />} />
      <Route key="events" path="/events" element={<Events userId={userId} />} />
      <Route key="calendar" path="/calendar" element={<Calendar userId={userId} />} />
    </Routes>
  </>
);

export default AppRoutes;
