import { useState, useEffect } from 'react';

/**
 * A simple hook to track the browser's online/offline status.
 * @returns {{isOnline: boolean}} An object containing the current online status.
 */
export const useOnlineStatus = () => {
  // Initialize state with the browser's current determination of online status.
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Define handler functions to update the state.
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Add the event listeners when the component mounts.
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // This is the cleanup function that runs when the component unmounts.
    // It's crucial to remove the event listeners to prevent memory leaks.
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // The empty array ensures this effect runs only once on mount and unmount.

  return { isOnline };
};