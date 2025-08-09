// src/pages/Settings.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import our custom hook

function Settings() {
  const { currentUser, handleLogout } = useAuth(); // Get the current user and logout function

  const onLogout = async () => {
    try {
      await handleLogout();
      // You will be automatically redirected because of our listener
    } catch (error) {
      alert('Failed to log out.');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>
      
      <div className="settings-section">
        {/* THE FIX: Show different content based on login state */}
        {currentUser ? (
          <div>
            <p>You are logged in as Admin:</p>
            <p><strong>{currentUser.email}</strong></p>
            <button onClick={onLogout} className="logout-button">
              Log Out
            </button>
          </div>
        ) : (
          <p>You are not logged in.</p>
        )}
      </div>

      <div className="admin-login-link-container">
        {!currentUser && (
          <Link to="/admin-login" className="admin-login-link">
            Admin Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default Settings;