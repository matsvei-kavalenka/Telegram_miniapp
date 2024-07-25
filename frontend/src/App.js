import './App.css';
import AppRoutes from './Routes';
import Alert from './Components/Alert/Alert';
import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

const tg = window.Telegram.WebApp;
const userId = tg.initDataUnsafe?.user?.id;

function App() {
  const [hide, setHide] = useState(true);

  useEffect(() => {
    tg.ready();
    tg.BackButton.show();
    tg.disableVerticalSwipes();

    const handleBackButton = () => {
      setHide(false);
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
      {!hide && (
        <Alert
          title='Exit'
          message='Are you sure you want to leave?'
          hide={hide}
          onClick1={() => tg.close()}
          onClick2={() => setHide(true)} />
      )}
    </BrowserRouter>
  );
}

export default App;
