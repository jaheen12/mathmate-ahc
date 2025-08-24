import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebaseConfig';
import { 
    doc, 
    onSnapshot, 
    updateDoc, 
    setDoc,
    serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNetworkStatus } from '../main.jsx';

export const useFirestoreDocument = (path) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromCache, setFromCache] = useState(false);
    const [hasPendingWrites, setHasPendingWrites] = useState(false);
    
    const { isOnline } = useNetworkStatus();
    const pathString = Array.isArray(path) ? path.join('/') : path;

    useEffect(() => {
        // --- THIS IS THE CRITICAL FIX ---
        // First, check if the path itself is a valid array.
        if (!Array.isArray(path)) {
            setLoading(false);
            return;
        }
        // Then, check if any segment of the path is null or undefined.
        // This happens when useParams hasn't resolved yet.
        const isPathReady = path.every(segment => segment);
        if (!isPathReady) {
            setLoading(false); // Stop loading, wait for a valid path
            return;
        }

        let docRef;
        try {
            docRef = doc(db, ...path);
        } catch (err) {
            setError(err); 
            setLoading(false); 
            return;
        }

        const unsubscribe = onSnapshot(docRef, { includeMetadataChanges: true }, 
            (docSnap) => {
                if (docSnap.exists()) {
                    setData({ id: docSnap.id, ...docSnap.data(), _metadata: { fromCache: docSnap.metadata.fromCache, hasPendingWrites: docSnap.metadata.hasPendingWrites } });
                } else {
                    setData(null);
                }
                setFromCache(docSnap.metadata.fromCache);
                setHasPendingWrites(docSnap.metadata.hasPendingWrites);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
                toast.error(`Failed to load document: ${err.message}`);
            }
        );

        return () => unsubscribe();
    }, [pathString]); // The stringified path is a reliable dependency

    const updateDocument = useCallback(async (updatedData) => {
        const isPathReady = Array.isArray(path) && path.every(segment => segment);
        if (!isPathReady) return { success: false, error: new Error("Path is not ready") };
        try {
            const docRef = doc(db, ...path);
            await updateDoc(docRef, { ...updatedData, updatedAt: serverTimestamp() });
            toast.success("Document updated!");
            return { success: true };
        } catch (error) {
            toast.error(`Update failed: ${error.message}`);
            return { success: false, error };
        }
    }, [pathString]);

    return { data, loading, error, isOnline, fromCache, hasPendingWrites, updateDocument };
};