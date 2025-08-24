// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with enhanced cache configuration
const db = getFirestore(app);

// Enhanced persistence setup with multi-tab support and better error handling
const enablePersistence = async () => {
  try {
    // Try multi-tab persistence first (better for most web apps)
    await enableMultiTabIndexedDbPersistence(db);
    console.log('✅ Firestore multi-tab persistence enabled');
    return true;
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multi-tab persistence failed: Multiple tabs open, trying single-tab mode');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Multi-tab persistence not supported, trying single-tab mode');
    } else {
      console.warn('⚠️ Multi-tab persistence failed, trying single-tab mode:', err.message);
    }
    
    // Fallback to single-tab persistence
    try {
      await enableIndexedDbPersistence(db, {
        forceOwnership: false // Don't force ownership, allow other tabs
      });
      console.log('✅ Firestore single-tab persistence enabled');
      return true;
    } catch (fallbackErr) {
      if (fallbackErr.code === 'failed-precondition') {
        console.warn('⚠️ Persistence failed: Multiple tabs open');
      } else if (fallbackErr.code === 'unimplemented') {
        console.warn('⚠️ Persistence not supported in this browser');
      } else {
        console.error('❌ Failed to enable persistence:', fallbackErr);
      }
      return false;
    }
  }
};

// Enable persistence immediately
enablePersistence();

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  // Connect to Auth emulator
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('🔧 Connected to Auth emulator');
  } catch (error) {
    console.log('Auth emulator already connected or not available');
  }
  
  // Connect to Firestore emulator
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firestore emulator');
  } catch (error) {
    console.log('Firestore emulator already connected or not available');
  }
}

// Utility functions for cache management
export const clearFirestoreCache = async () => {
  try {
    await db.clearPersistence();
    console.log('✅ Firestore cache cleared');
    // Reload the page to reinitialize
    window.location.reload();
  } catch (error) {
    console.error('❌ Failed to clear Firestore cache:', error);
  }
};

export const getFirestoreCacheSize = async () => {
  try {
    // Note: This is not a direct Firestore API, but you can implement
    // custom logic to estimate cache size using IndexedDB APIs
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usagePercent: (estimate.usage / estimate.quota * 100).toFixed(2)
    };
  } catch (error) {
    console.error('Failed to get cache size estimate:', error);
    return null;
  }
};

// Network connectivity utilities
export const enableFirestoreNetwork = async () => {
  try {
    const { enableNetwork } = await import('firebase/firestore');
    await enableNetwork(db);
    console.log('✅ Firestore network enabled');
  } catch (error) {
    console.error('❌ Failed to enable Firestore network:', error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    const { disableNetwork } = await import('firebase/firestore');
    await disableNetwork(db);
    console.log('✅ Firestore network disabled (offline mode)');
  } catch (error) {
    console.error('❌ Failed to disable Firestore network:', error);
  }
};

export { auth, db };
export default app;