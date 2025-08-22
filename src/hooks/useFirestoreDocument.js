// src/hooks/useFirestoreDocument.js
import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export const useFirestoreDocument = (pathSegments) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // useMemo prevents the docRef from being recreated on every render
    const docRef = useMemo(() => {
        const validPathSegments = pathSegments.filter(segment => segment);
        if (validPathSegments.length !== pathSegments.length) {
            return null; // Return null if path is incomplete
        }
        return doc(db, ...validPathSegments);
    }, [JSON.stringify(pathSegments)]); // Correctly depend on pathSegments

    useEffect(() => {
        // Don't run the effect if the document reference is not ready
        if (!docRef) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data());
            } else {
                setData({}); // Set to empty object if it doesn't exist
            }
            setLoading(false); // This is now guaranteed to be called
        }, (error) => {
            console.error("Error listening to document: ", error);
            toast.error("Failed to load data.");
            setData({}); // Also set to empty on error to be safe
            setLoading(false);
        });

        return () => unsubscribe();
    }, [docRef]); // The effect now correctly depends on docRef

    const updateDocument = async (newData) => {
        if (!docRef) return;
        try {
            await setDoc(docRef, newData, { merge: true });
            toast.success('Data saved successfully!');
        } catch (error) {
            console.error("Error updating document: ", error);
            toast.error('Failed to save data.');
        }
    };

    return { data, loading, updateDocument };
};