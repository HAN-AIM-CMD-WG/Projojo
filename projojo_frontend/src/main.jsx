import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './components/AuthProvider.jsx';
import './index.css';
import NotifySystem from './components/notifications/NotifySystem.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotifySystem>
          <App />
        </NotifySystem>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
