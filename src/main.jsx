import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { TournamentProvider } from './context/TournamentContext';
import './index.css'; // or './App.css' if you renamed it


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TournamentProvider>
        <App />
      </TournamentProvider>
    </BrowserRouter>
  </React.StrictMode>
);
