// src/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
// We no longer need getAuth here
import { onAuthStateChanged, signOut } from 'firebase/auth';
// We import the already initialized auth service
import { auth } from './firebaseConfig'; 

// 1. Create the context
const AuthContext = createContext();

// 2. Create a custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// 3. Create the Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // The onAuthStateChanged listener automatically handles cleanup
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return unsubscribe; // This cleans up the listener
  }, []); // The empty dependency array is correct here

  const handleLogout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    authLoading,
    handleLogout,
  };

  // We will not render the children until the first auth check is complete
  return (
    <AuthContext.Provider value={value}>
      {!authLoading && children}
    </AuthContext.Provider>
  );
};