// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Firestore persistence enabled");
  })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code == 'unimplemented') {
      console.warn("Firestore persistence is not supported in this browser.");
    }
  });

export { auth, db };