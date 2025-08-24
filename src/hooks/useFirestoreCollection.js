import { useState, useEffect, useCallback, useRef, useMemo } from 'react'; // --- THIS IS THE FIX ---
import { db } from '../firebaseConfig';
import { 
    collection,
    query as firestoreQueryBuilder,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useNetworkStatus } from '../main.jsx';

// The hook now accepts a single argument: a path string, a path array, or a full Firestore Query object.
export const useFirestoreCollection = (pathOrQuery) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromCache, setFromCache] = useState(false);
    const [hasPendingWrites, setHasPendingWrites] = useState(false);
    
    const { isOnline } = useNetworkStatus();
    const unsubscribeRef = useRef(null);

    // This useMemo is now correctly defined because we imported it.
    const queryKey = useMemo(() => {
        if (!pathOrQuery) return null;
        if (typeof pathOrQuery === 'object') {
            try {
                // A more robust way to create a key from a query object
                const path = pathOrQuery._query.path.segments.join('/');
                const constraints = JSON.stringify(pathOrQuery._query.constraints);
                return `${path}_${constraints}`;
            } catch (e) {
                // Fallback for complex objects, though it might be less stable
                return JSON.stringify(pathOrQuery);
            }
        }
        return Array.isArray(pathOrQuery) ? pathOrQuery.join('/') : pathOrQuery;
    }, [pathOrQuery]);

    useEffect(() => {
        if (!pathOrQuery) {
            setData([]);
            setLoading(false);
            return;
        }

        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }
        setLoading(true);

        let queryRef;
        try {
            if (typeof pathOrQuery === 'string') {
                queryRef = collection(db, pathOrQuery);
            } else if (Array.isArray(pathOrQuery)) {
                const validPath = pathOrQuery.filter(Boolean);
                if (validPath.length > 0) {
                    queryRef = collection(db, ...validPath);
                } else {
                    setData([]); setLoading(false); return;
                }
            } else {
                queryRef = pathOrQuery;
            }
        } catch (err) {
            setError(err); setLoading(false); return;
        }

        const unsubscribe = onSnapshot(queryRef, { includeMetadataChanges: true }, 
            (snapshot) => {
                const dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), _metadata: { fromCache: doc.metadata.fromCache, hasPendingWrites: doc.metadata.hasPendingWrites } }));
                setData(dataList);
                setFromCache(snapshot.metadata.fromCache);
                setHasPendingWrites(snapshot.docs.some(d => d.metadata.hasPendingWrites));
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
                toast.error(`Failed to load data: ${err.message}`);
            }
        );

        unsubscribeRef.current = unsubscribe;
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
        
    }, [queryKey]);

    const getBaseCollectionRef = useCallback(() => {
        if (!pathOrQuery) return null;
        if (typeof pathOrQuery === 'string') return collection(db, pathOrQuery);
        if (Array.isArray(pathOrQuery)) return collection(db, ...pathOrQuery.filter(Boolean));
        if (pathOrQuery && pathOrQuery._query?.path) return collection(db, pathOrQuery._query.path.segments.join('/'));
        return null;
    }, [pathOrQuery]);

    const addItem = useCallback(async (newItemData) => {
        const ref = getBaseCollectionRef();
        if (!ref) return;
        try {
            await addDoc(ref, { ...newItemData, createdAt: serverTimestamp() });
            toast.success('Item added successfully!');
        } catch (error) {
            toast.error(`Failed to add item: ${error.message}`);
        }
    }, [getBaseCollectionRef]);

    const updateItem = useCallback(async (itemId, updatedData) => {
        const ref = getBaseCollectionRef();
        if (!ref) return;
        try {
            const docRef = doc(ref, itemId);
            await updateDoc(docRef, { ...updatedData, updatedAt: serverTimestamp() });
            toast.success('Item updated successfully!');
        } catch (error) {
            toast.error(`Failed to update item: ${error.message}`);
        }
    }, [getBaseCollectionRef]);

    const deleteItem = useCallback(async (itemId, skipConfirmation = false) => {
        const ref = getBaseCollectionRef();
        if (!ref) return;
        if (!skipConfirmation && !window.confirm("Are you sure you want to delete this item?")) {
            return;
        }
        try {
            const docRef = doc(ref, itemId);
            await deleteDoc(docRef);
            toast.success('Item deleted successfully!');
        } catch (error) {
            toast.error(`Failed to delete item: ${error.message}`);
        }
    }, [getBaseCollectionRef]);
    
    return { data, loading, error, isOnline, fromCache, hasPendingWrites, addItem, deleteItem, updateItem };
};