import React, { useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Make sure this path is correct

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This function will be called by Firebase when the user's login state is first checked,
        // and every time it changes (login or logout).
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });

        // This cleans up the listener when the component is no longer needed.
        return unsubscribe;
    }, []);

    const value = {
        currentUser
    };

    // --- THIS IS THE CRITICAL FIX ---
    // We are removing the '!loading &&' check.
    // The AuthProvider's only job is to provide the context value.
    // The pages themselves will show a loading state if they need to.
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}