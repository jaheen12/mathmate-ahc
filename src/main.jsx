// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import AuthProvider from './AuthContext.jsx';
import { ToastContainer } from 'react-toastify';
import './firebaseConfig.js'; // Initialize Firebase early
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // --- CHANGE: Import the service worker

// CSS imports
import 'react-loading-skeleton/dist/skeleton.css';
import 'katex/dist/katex.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import './App.css';

// --- Network Status Context (No changes needed here, it's well implemented) ---
const NetworkStatusContext = React.createContext({ isOnline: true });
export const useNetworkStatus = () => React.useContext(NetworkStatusContext);

const NetworkStatusProvider = ({ children }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [showStatus, setShowStatus] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show status briefly if offline at load
    if (!navigator.onLine) setShowStatus(true);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline }}>
      {children}
      {showStatus && (
        <div
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            backgroundColor: isOnline ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          {isOnline ? '🟢 Back Online' : '🔴 Offline Mode'}
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </NetworkStatusContext.Provider>
  );
};

// --- Toast Container with offline-friendly settings ---
const EnhancedToastContainer = () => (
  <ToastContainer
    position="bottom-right"
    autoClose={5000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
    limit={navigator.onLine ? 5 : 2}
  />
);

// --- Render Application ---
// The main app rendering logic is now cleaner and more direct.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NetworkStatusProvider>
        <AuthProvider>
          <App />
          <EnhancedToastContainer />
        </AuthProvider>
      </NetworkStatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);


// --- CHANGE: Register the service worker ---
// This is the most critical change. This line tells the app to cache its own
// files (HTML, JS, CSS) so it can load even when the user is offline.
// Without this, the app itself cannot start without an internet connection.
serviceWorkerRegistration.register();

// Optional: Log storage usage for debugging purposes
if (typeof window !== 'undefined' && navigator.storage?.estimate) {
  navigator.storage.estimate().then(estimate => {
    console.log('💾 Storage estimate:', {
      used: `${(estimate.usage / 1024 / 1024).toFixed(2)} MB`,
      available: `${(estimate.quota / 1024 / 1024).toFixed(2)} MB`,
      percentage: `${((estimate.usage / estimate.quota) * 100).toFixed(1)}%`,
    });
  }).catch(error => {
    console.log('Storage estimate not available');
  });
}