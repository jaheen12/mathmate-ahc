// src/hooks/useFirestoreCollection.js
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query as firestoreQuery, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';

export const useFirestoreCollection = (queryOrPath) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collectionRef, setCollectionRef] = useState(null);

    useEffect(() => {
        let ref;
        if (Array.isArray(queryOrPath)) {
            const validPath = queryOrPath.filter(segment => segment);
            if (validPath.length === queryOrPath.length) {
                ref = collection(db, ...validPath);
            }
        }
        setCollectionRef(ref);

        // Use onSnapshot for real-time updates that work offline
        const q = Array.isArray(queryOrPath) ? ref : queryOrPath;
        if (!q) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const dataList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(dataList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching collection: ", error);
            toast.error("Failed to fetch data.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [JSON.stringify(queryOrPath)]);

    const addItem = async (newItemData) => {
        if (!collectionRef) return;
        try {
            await addDoc(collectionRef, {
                ...newItemData,
                createdAt: new Date()
            });
            toast.success('Item added successfully!');
        } catch (error) {
            console.error("Error adding document: ", error);
            toast.error('Failed to add item.');
        }
    };

    const deleteItem = async (itemId) => {
        if (!collectionRef) return;
        if (window.confirm("Are you sure you want to delete this item?")) {
            try {
                const docRef = doc(collectionRef, itemId);
                await deleteDoc(docRef);
                toast.success('Item deleted successfully!');
            } catch (error) {
                console.error("Error deleting document: ", error);
                toast.error('Failed to delete item.');
            }
        }
    };

    const updateItem = async (itemId, updatedData) => {
        if (!collectionRef) return;
        try {
            const docRef = doc(collectionRef, itemId);
            await updateDoc(docRef, updatedData);
            toast.success('Item updated successfully!');
        } catch (error) {
            console.error("Error updating document: ", error);
            toast.error('Failed to update item.');
        }
    };

    return { data, loading, addItem, deleteItem, updateItem };
};