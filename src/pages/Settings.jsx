import React from 'react';
import { Link } from 'react-router-dom'; // We'll use Link to navigate
import { Cog } from 'lucide-react';

function Settings() {
  // In a real app, you'd have more settings here like theme toggle, etc.
  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>
      
      <div className="settings-section">
        <p>App Version: 1.0.0</p>
        {/* Add more settings options here later */}
      </div>

      {/* This is the hidden link to our admin panel */}
      <div className="admin-login-link-container">
        <Link to="/admin-login" className="admin-login-link">
          Admin Login
        </Link>
      </div>
    </div>
  );
}

export default Settings;