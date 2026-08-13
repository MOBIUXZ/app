import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { KeyboardLayerProvider } from './components/shared.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KeyboardLayerProvider>
      <App />
    </KeyboardLayerProvider>
  </React.StrictMode>
);
