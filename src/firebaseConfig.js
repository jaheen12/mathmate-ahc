import { initializeApp } from "firebase/app";
import { getFirestore, enablePersistence } from "firebase/firestore"; // Modified this line
import { getAuth } from "firebase/auth";
import dotenv from 'dotenv';

// This line will only work in the Node.js environment (for our script)
// In the Vite/browser environment, 'process' does not exist.
if (typeof process !== 'undefined') {
  dotenv.config();
}

// Check if we are in the Vite (browser) environment
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

// Initialize Firestore
const db = getFirestore(app);

// --- THIS IS THE NEW CODE TO ENABLE OFFLINE CACHING ---
// It attempts to enable offline persistence for Firestore.
enablePersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // This can happen if you have multiple tabs of your app open.
      // Persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: Multiple tabs open. Offline features may be limited.');
    } else if (err.code == 'unimplemented') {
      // This means the browser is too old or doesn't support the required features.
      console.error('Firestore persistence is not available in this browser.');
    }
  });
// --- END OF NEW CODE ---


// Initialize Auth
export const auth = getAuth(app);

// Export db instance for use in other files
export { db };