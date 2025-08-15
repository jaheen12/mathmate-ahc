// src/main.jsx
import { Capacitor } from '@capacitor/core';
window.Capacitor = Capacitor;
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './AuthContext.jsx'; // Import the AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap the App component */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
);