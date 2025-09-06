import { initializeApp } from "firebase/app";
// --- CHANGE: We need BOTH functions from the main firestore package ---
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import dotenv from 'dotenv';

if (typeof process !== 'undefined') {
  dotenv.config();
}

const isViteEnv = typeof import.meta.env !== 'undefined';

const firebaseConfig = {
  apiKey: isViteEnv ? import.meta.env.VITE_API_KEY : process.env.VITE_API_KEY,
  authDomain: isViteEnv ? import.meta.env.VITE_AUTH_DOMAIN : process.env.VITE_AUTH_DOMAIN,
  projectId: isViteEnv ? import.meta.env.VITE_PROJECT_ID : process.env.VITE_PROJECT_ID,
  storageBucket: isViteEnv ? import.meta.env.VITE_STORAGE_BUCKET : process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: isViteEnv ? import.meta.env.VITE_MESSAGING_SENDER_ID : process.env.VITE_MESSAGING_SENDER_ID,
  appId: isViteEnv ? import.meta.env.VITE_APP_ID : process.env.VITE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// --- THIS IS THE CRITICAL AND CORRECT PATTERN ---
// 1. Get the Firestore instance first.
const db = getFirestore(app);

// 2. Then, enable persistence ON THAT INSTANCE.
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // This can happen if you have multiple tabs of your app open.
      console.warn('Firestore persistence failed: Multiple tabs open. Offline features may be limited.');
    } else if (err.code === 'unimplemented') {
      // The browser is too old or doesn't support the required features.
      console.error('Firestore persistence is not available in this browser.');
    }
  });
// --- END OF CORRECT PATTERN ---


// Initialize Firebase Storage
export const storage = getStorage(app); 

// Initialize Auth
export const auth = getAuth(app);

// Export db instance for use in other files
export { db };
