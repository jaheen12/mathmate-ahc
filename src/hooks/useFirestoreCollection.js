// src/hooks/useFirestoreCollection.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebaseConfig';
import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc, 
    updateDoc, 
    query as firestoreQuery, 
    onSnapshot,
    writeBatch,
    serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-toastify';

export const useFirestoreCollection = (queryOrPath, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collectionRef, setCollectionRef] = useState(null);
    const unsubscribeRef = useRef(null);
    
    const {
        enableRealtime = true,
        includeMetadata = false,
        onError,
        onDataChange,
        retryAttempts = 3,
        retryDelay = 1000
    } = options;

    // Memoize the query string for better dependency comparison
    const queryString = typeof queryOrPath === 'string' 
        ? queryOrPath 
        : JSON.stringify(queryOrPath);

    useEffect(() => {
        let ref;
        setError(null);
        
        // Clean up previous subscription
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        try {
            if (Array.isArray(queryOrPath)) {
                const validPath = queryOrPath.filter(segment => segment && segment.trim());
                if (validPath.length === 0) {
                    throw new Error('Invalid collection path: empty or invalid segments');
                }
                if (validPath.length !== queryOrPath.length) {
                    console.warn('Some path segments were filtered out due to being empty');
                }
                ref = collection(db, ...validPath);
            } else if (typeof queryOrPath === 'string') {
                if (!queryOrPath.trim()) {
                    throw new Error('Collection path cannot be empty');
                }
                ref = collection(db, queryOrPath);
            } else {
                // Assume it's already a query or collection reference
                ref = queryOrPath;
            }

            setCollectionRef(ref);
            
            if (!ref) {
                setLoading(false);
                return;
            }

            const fetchData = async (attemptNumber = 1) => {
                try {
                    setLoading(true);
                    
                    if (enableRealtime) {
                        // Real-time listener
                        const unsubscribe = onSnapshot(
                            ref, 
                            {
                                includeMetadataChanges: includeMetadata
                            },
                            (querySnapshot) => {
                                const dataList = querySnapshot.docs.map(docSnap => {
                                    const data = {
                                        id: docSnap.id,
                                        ...docSnap.data()
                                    };
                                    
                                    if (includeMetadata) {
                                        data._metadata = {
                                            fromCache: docSnap.metadata.fromCache,
                                            hasPendingWrites: docSnap.metadata.hasPendingWrites,
                                            isEqual: docSnap.metadata.isEqual
                                        };
                                    }
                                    
                                    return data;
                                });
                                
                                setData(dataList);
                                setLoading(false);
                                setError(null);
                                
                                if (onDataChange) {
                                    onDataChange(dataList);
                                }
                            },
                            (err) => {
                                console.error("Error in real-time listener: ", err);
                                setError(err);
                                setLoading(false);
                                
                                if (onError) {
                                    onError(err);
                                } else {
                                    toast.error(`Failed to fetch data: ${err.message}`);
                                }
                                
                                // Retry logic for real-time listener
                                if (attemptNumber < retryAttempts) {
                                    console.log(`Retrying connection (attempt ${attemptNumber + 1}/${retryAttempts})`);
                                    setTimeout(() => fetchData(attemptNumber + 1), retryDelay * attemptNumber);
                                }
                            }
                        );
                        
                        unsubscribeRef.current = unsubscribe;
                    } else {
                        // One-time fetch
                        const querySnapshot = await getDocs(ref);
                        const dataList = querySnapshot.docs.map(docSnap => ({
                            id: docSnap.id,
                            ...docSnap.data()
                        }));
                        
                        setData(dataList);
                        setLoading(false);
                        setError(null);
                        
                        if (onDataChange) {
                            onDataChange(dataList);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching collection: ", err);
                    setError(err);
                    setLoading(false);
                    
                    if (onError) {
                        onError(err);
                    } else {
                        toast.error(`Failed to fetch data: ${err.message}`);
                    }
                    
                    // Retry logic
                    if (attemptNumber < retryAttempts) {
                        console.log(`Retrying fetch (attempt ${attemptNumber + 1}/${retryAttempts})`);
                        setTimeout(() => fetchData(attemptNumber + 1), retryDelay * attemptNumber);
                    }
                }
            };

            fetchData();
            
        } catch (err) {
            console.error("Error setting up collection reference: ", err);
            setError(err);
            setLoading(false);
            
            if (onError) {
                onError(err);
            } else {
                toast.error(`Configuration error: ${err.message}`);
            }
        }

        // Cleanup function
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [queryString, enableRealtime, includeMetadata, onError, onDataChange, retryAttempts, retryDelay]);

    const addItem = useCallback(async (newItemData, customToast = true) => {
        if (!collectionRef) {
            const error = new Error('Collection reference not available');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        try {
            const docData = {
                ...newItemData,
                createdAt: serverTimestamp(), // Use server timestamp for consistency
                updatedAt: serverTimestamp()
            };
            
            const docRef = await addDoc(collectionRef, docData);
            
            if (customToast) {
                toast.success('Item added successfully!');
            }
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error adding document: ", error);
            
            if (customToast) {
                toast.error(`Failed to add item: ${error.message}`);
            }
            
            if (onError) onError(error);
            return { success: false, error };
        }
    }, [collectionRef, onError]);

    const deleteItem = useCallback(async (itemId, skipConfirmation = false, customToast = true) => {
        if (!collectionRef) {
            const error = new Error('Collection reference not available');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        if (!skipConfirmation && !window.confirm("Are you sure you want to delete this item?")) {
            return { success: false, cancelled: true };
        }
        
        try {
            const docRef = doc(collectionRef, itemId);
            await deleteDoc(docRef);
            
            if (customToast) {
                toast.success('Item deleted successfully!');
            }
            
            return { success: true };
        } catch (error) {
            console.error("Error deleting document: ", error);
            
            if (customToast) {
                toast.error(`Failed to delete item: ${error.message}`);
            }
            
            if (onError) onError(error);
            return { success: false, error };
        }
    }, [collectionRef, onError]);

    const updateItem = useCallback(async (itemId, updatedData, customToast = true) => {
        if (!collectionRef) {
            const error = new Error('Collection reference not available');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        try {
            const docRef = doc(collectionRef, itemId);
            const dataToUpdate = {
                ...updatedData,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(docRef, dataToUpdate);
            
            if (customToast) {
                toast.success('Item updated successfully!');
            }
            
            return { success: true };
        } catch (error) {
            console.error("Error updating document: ", error);
            
            if (customToast) {
                toast.error(`Failed to update item: ${error.message}`);
            }
            
            if (onError) onError(error);
            return { success: false, error };
        }
    }, [collectionRef, onError]);

    const batchDelete = useCallback(async (itemIds, customToast = true) => {
        if (!collectionRef || !itemIds.length) {
            return { success: false, error: new Error('Invalid parameters') };
        }
        
        try {
            const batch = writeBatch(db);
            itemIds.forEach(id => {
                const docRef = doc(collectionRef, id);
                batch.delete(docRef);
            });
            
            await batch.commit();
            
            if (customToast) {
                toast.success(`${itemIds.length} items deleted successfully!`);
            }
            
            return { success: true };
        } catch (error) {
            console.error("Error batch deleting documents: ", error);
            
            if (customToast) {
                toast.error(`Failed to delete items: ${error.message}`);
            }
            
            if (onError) onError(error);
            return { success: false, error };
        }
    }, [collectionRef, onError]);

    const refresh = useCallback(async () => {
        if (!collectionRef) return;
        
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collectionRef);
            const dataList = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            
            setData(dataList);
            setError(null);
            
            if (onDataChange) {
                onDataChange(dataList);
            }
        } catch (err) {
            console.error("Error refreshing data: ", err);
            setError(err);
            
            if (onError) {
                onError(err);
            } else {
                toast.error(`Failed to refresh data: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [collectionRef, onDataChange, onError]);

    return { 
        data, 
        loading, 
        error,
        addItem, 
        deleteItem, 
        updateItem, 
        batchDelete,
        refresh,
        collectionRef 
    };
};