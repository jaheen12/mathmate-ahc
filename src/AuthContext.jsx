import React, { useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Make sure this path is correct

const AuthContext = React.createContext();

// Export the useAuth hook as a named export
export function useAuth() {
    return useContext(AuthContext);
}

// Move AuthProvider to be the default export to fix fast refresh issue
function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    // Ignore the unused 'loading' variable by prefixing it with an underscore.
    const [_loading, setLoading] = useState(true);

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
    
    // The AuthProvider's only job is to provide the context value.
    // Pages that consume this context can decide what to render based on the value.
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Export AuthProvider as both named and default export for flexibility
export { AuthProvider };
export default AuthProvider;