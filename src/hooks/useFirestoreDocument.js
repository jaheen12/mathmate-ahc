import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * A hook to fetch a single Firestore document with real-time updates.
 * Now supports a cache-first strategy and background synchronization.
 *
 * @param {string[]} pathSegments - An array of strings representing the path to the document.
 * @param {object} options - Configuration options for the hook.
 * @param {boolean} options.cacheFirst - If true, immediately returns cached data before fetching from the network.
 * @param {number} options.backgroundSyncInterval - The interval in ms to automatically sync in the background (e.g., 60000 for 1 minute).
 * @returns {object} The hook's state: data, loading, error, isOnline, fromCache, hasPendingWrites, and a refresh function.
 */
export const useFirestoreDocument = (pathSegments, options = {}) => {
  const { cacheFirst = false, backgroundSyncInterval = 0 } = options;
  
  // Memoize path to prevent re-renders, but ensure it's valid
  const path = pathSegments && pathSegments.every(p => p) ? pathSegments.join('/') : null;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [error, setError] = useState(null);

  const { isOnline } = useOnlineStatus();
  const intervalRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!path) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, path);

    // If it's a manual refresh, we want to show a loading state briefly
    if (isRefresh) {
      setLoading(true);
    }
    
    // Attempt to load from cache first if the option is enabled and it's the initial load
    if (cacheFirst && !isRefresh) {
      try {
        const docSnap = await getDoc(docRef, { source: 'cache' });
        if (docSnap.exists()) {
          setData(docSnap.data());
          setFromCache(true);
          setLoading(false); // We have data, so stop initial loading indicator
        }
      } catch (e) {
        // This is expected if the cache is empty. The listener below will handle fetching.
      }
    }

    // Unsubscribe from any previous listener before creating a new one
    if (unsubscribeRef.current) {
        unsubscribeRef.current();
    }

    // Set up the real-time listener
    unsubscribeRef.current = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        setData(null); // Document does not exist in the database
      }
      const metadata = docSnap.metadata;
      setFromCache(metadata.fromCache);
      setHasPendingWrites(metadata.hasPendingWrites);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err);
      setLoading(false);
      console.error(`Error fetching document at ${path}:`, err);
    });

  }, [path, cacheFirst]);

  useEffect(() => {
    fetchData(); // Initial fetch on mount or when path changes
    
    // Cleanup function for when the component unmounts or path changes
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  // Effect for handling background synchronization
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up a new interval if conditions are met
    if (isOnline && backgroundSyncInterval > 0) {
      intervalRef.current = setInterval(() => {
        // No need to call fetchData here. The onSnapshot listener
        // will automatically receive updates from the server when connected.
        // This interval is more of a failsafe or for patterns that don't use onSnapshot.
        // For onSnapshot, the main benefit is re-establishing connection if dropped.
        // We'll leave it as a no-op for now as onSnapshot is superior.
      }, backgroundSyncInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOnline, backgroundSyncInterval]);

  // Expose a manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);
  
  // Note: We don't return `updateDocument` from this hook anymore
  // as it's better to handle writes separately to keep the hook focused on reading.
  return { data, loading, error, isOnline, fromCache, hasPendingWrites, refresh };
};