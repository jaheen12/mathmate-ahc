import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query } from 'firebase/firestore';
import { toast } from 'react-toastify';

/**
 * A custom hook to manage a Firestore collection.
 * @param {Array<string>} pathSegments - An array of strings representing the path to the collection.
 *                                      e.g., ['official_notes'] or ['official_notes', subjectId, 'chapters']
 * @param {object} baseQuery - An optional query constraint to apply when fetching.
 */
export const useFirestoreCollection = (pathSegments, baseQuery = null) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter out any undefined or null path segments to prevent errors
    const validPathSegments = pathSegments.filter(segment => segment);

    // Memoize the fetch function to prevent unnecessary re-renders
    const fetchData = useCallback(async () => {
        // Only proceed if the path is complete
        if (validPathSegments.length !== pathSegments.length) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const collectionRef = collection(db, ...validPathSegments);
            let finalQuery = baseQuery ? query(collectionRef, baseQuery) : collectionRef;
            
            const querySnapshot = await getDocs(finalQuery);
            const dataList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(dataList);
        } catch (error) {
            console.error("Error fetching collection: ", error, "Path:", validPathSegments);
            toast.error("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(validPathSegments), baseQuery]); // Use JSON.stringify to compare array dependencies

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addItem = async (newItemData) => {
        try {
            const collectionRef = collection(db, ...validPathGit);
            const docRef = await addDoc(collectionRef, {
                ...newItemData,
                createdAt: new Date()
            });
            // Optimistically update the local state
            setData(prevData => [...prevData, { id: docRef.id, ...newItemData }]);
            toast.success('Item added successfully!');
        } catch (error) {
            console.error("Error adding document: ", error);
            toast.error('Failed to add item.');
        }
    };

    const deleteItem = async (itemId) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                const docRef = doc(db, ...validPathSegments, itemId);
                await deleteDoc(docRef);
                // Optimistically update the local state
                setData(prevData => prevData.filter(item => item.id !== itemId));
                toast.success('Item deleted successfully!');
            } catch (error) {
                console.error("Error deleting document: ", error);
                toast.error('Failed to delete item.');
            }
        }
    };

    const updateItem = async (itemId, updatedData) => {
        try {
            const docRef = doc(db, ...validPathSegments, itemId);
            await updateDoc(docRef, updatedData);
            // Optimistically update the local state
            setData(prevData => prevData.map(item =>
                item.id === itemId ? { ...item, ...updatedData } : item
            ));
            toast.success('Item updated successfully!');
        } catch (error) {
            console.error("Error updating document: ", error);
            toast.error('Failed to update item.');
        }
    };

    return { data, loading, addItem, deleteItem, updateItem };
};