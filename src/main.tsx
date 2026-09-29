import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global guard for Vite HMR websocket disconnection behind proxy/iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event.reason ? String(event.reason.message || event.reason) : '';
    if (reasonStr.includes('WebSocket') || reasonStr.includes('websocket')) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener('error', (event) => {
    const errorMsg = event.message ? String(event.message) : '';
    if (errorMsg.includes('WebSocket') || errorMsg.includes('websocket') || errorMsg.includes('[vite]')) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
