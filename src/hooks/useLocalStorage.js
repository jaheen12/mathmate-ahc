import { useState, useEffect, useCallback, useRef } from 'react';

// Custom serializer/deserializer functions
const defaultSerializer = {
    parse: JSON.parse,
    stringify: JSON.stringify,
};

function useLocalStorage(key, initialValue, options = {}) {
    const {
        serializer = defaultSerializer,
        syncAcrossTabs = true,
        removeOnError = false,
        onError = null,
        validateValue = null,
        debounceDelay = 0,
    } = options;

    const debounceTimeoutRef = useRef(null);
    const isInitializedRef = useRef(false);

    // Get from local storage then parse stored json or return initialValue
    const readValue = useCallback(() => {
        // Prevent build errors with server-side rendering
        if (typeof window === 'undefined') {
            return typeof initialValue === 'function' ? initialValue() : initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            
            if (item === null) {
                return typeof initialValue === 'function' ? initialValue() : initialValue;
            }

            const parsedValue = serializer.parse(item);
            
            // Validate the parsed value if validator is provided
            if (validateValue && !validateValue(parsedValue)) {
                console.warn(`Invalid value found in localStorage for key "${key}"`);
                if (removeOnError) {
                    window.localStorage.removeItem(key);
                }
                return typeof initialValue === 'function' ? initialValue() : initialValue;
            }
            
            return parsedValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            
            if (onError) {
                onError(error, 'read');
            }
            
            if (removeOnError) {
                try {
                    window.localStorage.removeItem(key);
                } catch (removeError) {
                    console.warn(`Failed to remove corrupted localStorage key "${key}":`, removeError);
                }
            }
            
            return typeof initialValue === 'function' ? initialValue() : initialValue;
        }
    }, [key, initialValue, serializer, validateValue, removeOnError, onError]);

    const [storedValue, setStoredValue] = useState(() => {
        // Only read from localStorage on initial mount to avoid hydration mismatches
        return readValue();
    });

    // Return a wrapped version of useState's setter function that persists the new value to localStorage
    const setValue = useCallback((value) => {
        // Prevent build errors with server-side rendering
        if (typeof window === 'undefined') {
            console.warn(
                `Tried setting localStorage key "${key}" even though environment is not a client`
            );
            return;
        }

        try {
            // Allow value to be a function so we have the same API as useState
            const newValue = value instanceof Function ? value(storedValue) : value;
            
            // Validate the new value if validator is provided
            if (validateValue && !validateValue(newValue)) {
                const error = new Error(`Invalid value provided for localStorage key "${key}"`);
                if (onError) {
                    onError(error, 'write');
                }
                throw error;
            }

            const writeToStorage = () => {
                try {
                    // Save to local storage
                    if (newValue === undefined) {
                        window.localStorage.removeItem(key);
                    } else {
                        window.localStorage.setItem(key, serializer.stringify(newValue));
                    }
                    
                    // Save state
                    setStoredValue(newValue);
                    
                    // Dispatch custom event so every useLocalStorage hook is notified
                    if (syncAcrossTabs) {
                        window.dispatchEvent(new CustomEvent("local-storage", {
                            detail: { key, newValue }
                        }));
                    }
                } catch (error) {
                    console.warn(`Error setting localStorage key "${key}":`, error);
                    if (onError) {
                        onError(error, 'write');
                    }
                }
            };

            if (debounceDelay > 0) {
                // Clear previous timeout
                if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                }
                
                // Set new timeout
                debounceTimeoutRef.current = setTimeout(writeToStorage, debounceDelay);
            } else {
                writeToStorage();
            }
            
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
            if (onError) {
                onError(error, 'write');
            }
        }
    }, [key, storedValue, serializer, validateValue, onError, syncAcrossTabs, debounceDelay]);

    // Remove value from localStorage and reset to initial value
    const removeValue = useCallback(() => {
        if (typeof window === 'undefined') {
            console.warn(
                `Tried removing localStorage key "${key}" even though environment is not a client`
            );
            return;
        }

        try {
            window.localStorage.removeItem(key);
            const resetValue = typeof initialValue === 'function' ? initialValue() : initialValue;
            setStoredValue(resetValue);
            
            if (syncAcrossTabs) {
                window.dispatchEvent(new CustomEvent("local-storage", {
                    detail: { key, newValue: resetValue }
                }));
            }
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
            if (onError) {
                onError(error, 'remove');
            }
        }
    }, [key, initialValue, syncAcrossTabs, onError]);

    // Get current value without subscribing to changes (useful for event handlers)
    const getCurrentValue = useCallback(() => {
        return readValue();
    }, [readValue]);

    // Force refresh from localStorage
    const refresh = useCallback(() => {
        const currentValue = readValue();
        setStoredValue(currentValue);
    }, [readValue]);

    // Check if localStorage is available
    const isSupported = useCallback(() => {
        if (typeof window === 'undefined') return false;
        
        try {
            const testKey = '__localStorage_test__';
            window.localStorage.setItem(testKey, 'test');
            window.localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }, []);

    // Initialize value on mount
    useEffect(() => {
        if (!isInitializedRef.current && typeof window !== 'undefined') {
            const currentValue = readValue();
            setStoredValue(currentValue);
            isInitializedRef.current = true;
        }
    }, [readValue]);

    // Set up event listeners for storage changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e) => {
            // Handle native storage event (from other tabs/windows)
            if (e.key === key || e.key === null) {
                const newValue = readValue();
                setStoredValue(newValue);
            }
        };

        const handleCustomStorageChange = (e) => {
            // Handle custom event (from same tab)
            if (e.detail?.key === key) {
                setStoredValue(e.detail.newValue);
            }
        };

        if (syncAcrossTabs) {
            // Native storage event (works across tabs/windows but not in same tab)
            window.addEventListener("storage", handleStorageChange);
            // Custom event (works in same tab)
            window.addEventListener("local-storage", handleCustomStorageChange);
        }

        return () => {
            if (syncAcrossTabs) {
                window.removeEventListener("storage", handleStorageChange);
                window.removeEventListener("local-storage", handleCustomStorageChange);
            }
            
            // Clear debounce timeout on unmount
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [key, readValue, syncAcrossTabs]);

    return {
        value: storedValue,
        setValue,
        removeValue,
        getCurrentValue,
        refresh,
        isSupported,
    };
}

// Legacy array return for backward compatibility
useLocalStorage.asArray = function(key, initialValue, options = {}) {
    const { value, setValue, removeValue, getCurrentValue, refresh, isSupported } = useLocalStorage(key, initialValue, options);
    
    // Add remove and other methods to the setter function for convenience
    setValue.remove = removeValue;
    setValue.getCurrentValue = getCurrentValue;
    setValue.refresh = refresh;
    setValue.isSupported = isSupported;
    
    return [value, setValue];
};

export default useLocalStorage;