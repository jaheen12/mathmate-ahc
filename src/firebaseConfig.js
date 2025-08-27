import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);