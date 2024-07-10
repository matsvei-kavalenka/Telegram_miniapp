import './App.css';
import AppRoutes from './Routes'
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';

const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe?.user?.id;

function App() {
  useEffect(() => {
    tg.ready();
    tg.BackButton.show();

    const handleBackButton = () => {
      const userConfirmed = window.confirm("Are you sure you want to leave?");
      if (userConfirmed) {
        tg.close();
      }
    };

    tg.BackButton.onClick(handleBackButton);

    return () => {
      tg.BackButton.offClick(handleBackButton);
      tg.BackButton.hide();
    };

  }, []);

  return (
    <BrowserRouter>
      <AppRoutes userId={userId} />
    </BrowserRouter>
  );
}

export default App;

