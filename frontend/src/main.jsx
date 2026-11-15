import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import FlowProvider from './state/FlowProvider.jsx';
import './index.css';
import './i18n/index.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FlowProvider>
        <App />
      </FlowProvider>
    </BrowserRouter>
  </StrictMode>,
);
