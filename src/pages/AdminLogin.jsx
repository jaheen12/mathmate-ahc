// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();

  // ... inside AdminLogin.jsx

const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    navigate('/'); 
  } catch (error) {
  console.error("Firebase login error:", error.code);
  if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
    setError('Invalid email or password. Please try again.');
  } else {
    setError('An unexpected error occurred. Please try again later.');
  }
}
};

// ... rest of the file

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