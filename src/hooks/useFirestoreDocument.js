import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * A hook to fetch a single Firestore document with real-time updates and full offline support.
 * It uses Firestore's cache-first strategy by default when persistence is enabled.
 *
 * @param {string[]} pathSegments - An array of strings representing the path to the document.
 * @returns {object} The hook's state: data, loading, error, isOnline, fromCache, and hasPendingWrites.
 */
export const useFirestoreDocument = (pathSegments) => {
  // Memoize path to prevent re-renders, but ensure it's valid before joining.
  const path = pathSegments && pathSegments.every(p => p) ? pathSegments.join('/') : null;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // These states provide insight into the data's source and status
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  const { isOnline } = useOnlineStatus();
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // If the path is invalid or not provided, do nothing.
    if (!path) {
      setLoading(false);
      setData(null);
      return;
    }

    // Unsubscribe from any previous listener when the path changes or component unmounts.
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    // Set loading to true whenever a new document is being fetched.
    setLoading(true);

    const docRef = doc(db, path);

    // Set up the real-time listener. This is the core of the hook.
    // onSnapshot automatically handles offline data persistence and background syncing.
    // 1. It immediately reads from the local cache (if available).
    // 2. It listens for any changes from the server when online.
    // 3. It syncs local changes back to the server when connection is restored.
    unsubscribeRef.current = onSnapshot(docRef, { includeMetadataChanges: true }, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        // Document does not exist in cache or on the server.
        setData(null);
        console.warn(`Document not found at path: ${path}`);
      }
      
      const metadata = docSnap.metadata;
      setFromCache(metadata.fromCache);
      setHasPendingWrites(metadata.hasPendingWrites);
      setError(null); // Clear any previous errors on successful data fetch
      setLoading(false); // Data has been loaded (from cache or server), so stop loading.

    }, (err) => {
      // Handle any errors that occur during the fetch.
      setError(err);
      setLoading(false);
      console.error(`Error fetching document at ${path}:`, err);
    });

    // Cleanup function: This is crucial to prevent memory leaks.
    // It runs when the component unmounts or the path changes.
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [path]); // This effect re-runs only when the document path changes.

  // The hook returns the document data and its state.
  // The 'refresh' function is removed as onSnapshot handles this automatically.
  return { data, loading, error, isOnline, fromCache, hasPendingWrites };
};