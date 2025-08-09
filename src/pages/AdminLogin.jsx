import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault(); // Prevent form from reloading the page
    setError(''); // Clear previous errors

    // --- LOGIN LOGIC WILL GO HERE IN THE NEXT STEP ---
    console.log('Attempting to log in with:', email, password);

    // For now, let's pretend login is successful and navigate back home
    alert('Login functionality not yet implemented. Pretending to log in.');
    navigate('/'); // Go back to the dashboard
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Admin Login</h1>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="login-button">Sign In</button>
      </form>
    </div>
  );
}

export default AdminLogin;