// src/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

// 1. Create the context
const AuthContext = createContext();

// 2. Create a custom hook to easily use this context elsewhere
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Create the Provider component that will wrap our entire app
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // This is the magic: Firebase's listener that automatically
  // updates us whenever the user's login state changes.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup the listener when the component unmounts
    return unsubscribe;
  }, [auth]);

  const handleLogout = () => {
    return signOut(auth);
  };

  // The value provided to all children components
  const value = {
    currentUser,
    auth,
    handleLogout,
  };

  // We don't render the app until Firebase has checked the auth state
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};