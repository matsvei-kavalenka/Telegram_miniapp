import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ToDo from './Components/ToDo/todo';
import Events from './Components/events/events';
import Calendar from './Components/calendar/calendar';
import Navigation from './Components/navigation/navigation';

const AppRoutes = () => (
  <div>
    <Navigation />
    <Routes>
      <Route key="todo" path="/" element={<ToDo />} />
      <Route key="events" path="/events" element={<Events />} />
      <Route key="calendar" path="/calendar" element={<Calendar />} />
    </Routes>
  </div>
);

export default AppRoutes;
