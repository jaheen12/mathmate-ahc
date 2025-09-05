import React, { useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Make sure this path is correct

const AuthContext = React.createContext();

// Export the useAuth hook for easy consumption in other components
export function useAuth() {
    return useContext(AuthContext);
}

// The AuthProvider component that wraps your app
function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // We will now use this state

    useEffect(() => {
        // onAuthStateChanged is the core of Firebase Auth's persistence.
        // It fires once with the cached user (even offline) and then
        // again if the auth state changes.
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false); // Set loading to false after the first check
        });

        // Cleanup the listener when the component unmounts
        return unsubscribe;
    }, []);

    // The context value now includes the loading state
    const value = {
        currentUser,
        loading // <-- CHANGE: Expose the loading state
    };
    
    // We don't render children until the initial check is complete.
    // This prevents components from rendering with a 'null' user
    // when the app is just starting up.
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;