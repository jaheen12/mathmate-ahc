// src/hooks/useFirestoreDocument.js
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../firebaseConfig';
import { 
    doc, 
    onSnapshot, 
    setDoc, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'react-toastify';

export const useFirestoreDocument = (pathSegments, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exists, setExists] = useState(false);
    const unsubscribeRef = useRef(null);

    const {
        enableRealtime = true,
        includeMetadata = false,
        onError,
        onDataChange,
        retryAttempts = 3,
        retryDelay = 1000,
        defaultData = null
    } = options;

    // useMemo prevents the docRef from being recreated on every render
    const docRef = useMemo(() => {
        if (!pathSegments || pathSegments.length === 0) {
            return null;
        }
        
        const validPathSegments = pathSegments.filter(segment => 
            segment !== null && 
            segment !== undefined && 
            segment !== '' && 
            String(segment).trim() !== ''
        );
        
        if (validPathSegments.length === 0) {
            console.warn('All path segments are empty or invalid');
            return null;
        }
        
        if (validPathSegments.length !== pathSegments.length) {
            console.warn('Some path segments were filtered out due to being empty or invalid');
        }
        
        // Ensure we have an even number of segments (collection/doc pairs)
        if (validPathSegments.length % 2 === 0) {
            console.warn('Document path should have odd number of segments (collection/doc/collection/doc...)');
        }
        
        try {
            return doc(db, ...validPathSegments);
        } catch (err) {
            console.error('Error creating document reference:', err);
            return null;
        }
    }, [JSON.stringify(pathSegments)]); // Correctly depend on pathSegments

    useEffect(() => {
        setError(null);
        
        // Clean up previous subscription
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // Don't run the effect if the document reference is not ready
        if (!docRef) {
            setData(defaultData);
            setExists(false);
            setLoading(false);
            return;
        }

        const fetchDocument = async (attemptNumber = 1) => {
            try {
                setLoading(true);
                
                if (enableRealtime) {
                    // Real-time listener
                    const unsubscribe = onSnapshot(
                        docRef,
                        {
                            includeMetadataChanges: includeMetadata
                        },
                        (docSnap) => {
                            if (docSnap.exists()) {
                                let documentData = docSnap.data();
                                
                                if (includeMetadata) {
                                    documentData._metadata = {
                                        fromCache: docSnap.metadata.fromCache,
                                        hasPendingWrites: docSnap.metadata.hasPendingWrites,
                                        isEqual: docSnap.metadata.isEqual
                                    };
                                }
                                
                                setData(documentData);
                                setExists(true);
                            } else {
                                setData(defaultData);
                                setExists(false);
                            }
                            
                            setLoading(false);
                            setError(null);
                            
                            if (onDataChange) {
                                onDataChange(docSnap.exists() ? docSnap.data() : null, docSnap.exists());
                            }
                        },
                        (err) => {
                            console.error("Error listening to document: ", err);
                            setError(err);
                            setData(defaultData);
                            setExists(false);
                            setLoading(false);
                            
                            if (onError) {
                                onError(err);
                            } else {
                                toast.error(`Failed to load data: ${err.message}`);
                            }
                            
                            // Retry logic for real-time listener
                            if (attemptNumber < retryAttempts) {
                                console.log(`Retrying document listener (attempt ${attemptNumber + 1}/${retryAttempts})`);
                                setTimeout(() => fetchDocument(attemptNumber + 1), retryDelay * attemptNumber);
                            }
                        }
                    );
                    
                    unsubscribeRef.current = unsubscribe;
                } else {
                    // One-time fetch
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        setData(docSnap.data());
                        setExists(true);
                    } else {
                        setData(defaultData);
                        setExists(false);
                    }
                    
                    setLoading(false);
                    setError(null);
                    
                    if (onDataChange) {
                        onDataChange(docSnap.exists() ? docSnap.data() : null, docSnap.exists());
                    }
                }
            } catch (err) {
                console.error("Error fetching document: ", err);
                setError(err);
                setData(defaultData);
                setExists(false);
                setLoading(false);
                
                if (onError) {
                    onError(err);
                } else {
                    toast.error(`Failed to load data: ${err.message}`);
                }
                
                // Retry logic
                if (attemptNumber < retryAttempts) {
                    console.log(`Retrying document fetch (attempt ${attemptNumber + 1}/${retryAttempts})`);
                    setTimeout(() => fetchDocument(attemptNumber + 1), retryDelay * attemptNumber);
                }
            }
        };

        fetchDocument();

        // Cleanup function
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [docRef, enableRealtime, includeMetadata, onError, onDataChange, retryAttempts, retryDelay, defaultData]);

    const setDocument = useCallback(async (newData, merge = true, customToast = true) => {
        if (!docRef) {
            const error = new Error('Document reference not available');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        try {
            const dataToSet = {
                ...newData,
                updatedAt: serverTimestamp()
            };
            
            // Add createdAt only if document doesn't exist and we're not merging
            if (!exists && !merge) {
                dataToSet.createdAt = serverTimestamp();
            } else if (!exists && merge) {
                // When merging a new document, add createdAt if it doesn't exist
                dataToSet.createdAt = serverTimestamp();
            }
            
            await setDoc(docRef, dataToSet, { merge });
            
            if (customToast) {
                toast.success('Data saved successfully!');
            }
            
            return { success: true };
        } catch (error) {
            console.error("Error setting document: ", error);
            
            if (customToast) {
                toast.error(`Failed to save data: ${error.message}`);
            }
            
            if (onError) onError(error);
            return { success: false, error };
        }
    }, [docRef, exists, onError]);

    const updateDocument = useCallback(async (newData, customToast = true) => {
        if (!docRef) {
            const error = new Error('Document reference not available');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        if (!exists) {
            const error = new Error('Cannot update document that does not exist');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        try {
            const dataToUpdate = {
                ...newData,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(docRef, dataToUpdate);
            
            if (customToast) {
                toast.success('Data updated successfully!');
            }
            
            return { success: true };
        } catch (error) {
            console.error("Error updating document: ", error);
            
            if (customToast) {
                toast.error(`Failed to update data: ${error.message}`);
            }
            
            if (onError) onError(error);
            return { success: false, error };
        }
    }, [docRef, exists, onError]);

    const deleteDocument = useCallback(async (skipConfirmation = false, customToast = true) => {
        if (!docRef) {
            const error = new Error('Document reference not available');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        if (!exists) {
            const error = new Error('Document does not exist');
            if (onError) onError(error);
            return { success: false, error };
        }
        
        if (!skipConfirmation && !window.confirm("Are you sure you want to delete this document?")) {
            return { success: false, cancelled: true };
        }
        
        try {
            await deleteDoc(docRef);
            
            if (customToast) {
                toast.success('Document deleted successfully!');
            }
            
            return { success: true };
        } catch (error) {
            console.error("Error deleting document: ", error);
            
            if (customToast) {
                toast.error(`Failed to delete document: ${error.message}`);
            }
            
            if (onError) onError(error);
            return { success: false, error };
        }
    }, [docRef, exists, onError]);

    const refresh = useCallback(async () => {
        if (!docRef) return;
        
        try {
            setLoading(true);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setData(docSnap.data());
                setExists(true);
            } else {
                setData(defaultData);
                setExists(false);
            }
            
            setError(null);
            
            if (onDataChange) {
                onDataChange(docSnap.exists() ? docSnap.data() : null, docSnap.exists());
            }
        } catch (err) {
            console.error("Error refreshing document: ", err);
            setError(err);
            
            if (onError) {
                onError(err);
            } else {
                toast.error(`Failed to refresh data: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, [docRef, defaultData, onDataChange, onError]);

    return { 
        data, 
        loading, 
        error,
        exists,
        setDocument,
        updateDocument, 
        deleteDocument,
        refresh,
        docRef
    };
};