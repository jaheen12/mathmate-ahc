// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { ToastContainer } from 'react-toastify';
import './firebaseConfig.js'; // Initialize Firebase early

// CSS imports
import 'react-loading-skeleton/dist/skeleton.css';
import 'katex/dist/katex.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import './App.css';

// --- Network Status Context ---
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

// --- Initialize Application ---
const initializeApp = async () => {
  // Slight delay to allow Firebase persistence
  await new Promise(resolve => setTimeout(resolve, 100));

  // Optional storage estimate logging
  if (typeof window !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      console.log('💾 Storage estimate:', {
        used: `${(estimate.usage / 1024 / 1024).toFixed(2)} MB`,
        available: `${(estimate.quota / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${((estimate.usage / estimate.quota) * 100).toFixed(1)}%`,
      });
    } catch (error) {
      console.log('Storage estimate not available');
    }
  }

  // Render the app
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
};

// --- Initialize with fallback ---
initializeApp().catch(error => {
  console.error('Failed to initialize app:', error);

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <ToastContainer />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
});