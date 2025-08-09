// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import getAuth here
import { getFirestore } from "firebase/firestore";

// ▼▼▼ PASTE YOUR FIREBASE CONFIG OBJECT HERE ▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyBafBv2UojhGRQjeiZoG4ES7O19jZ6OZvU",
  authDomain: "mathmate-ahc-app.firebaseapp.com",
  projectId: "mathmate-ahc-app",
  storageBucket: "mathmate-ahc-app.firebasestorage.app",
  messagingSenderId: "324907269101",
  appId: "1:324907269101:web:5ec3feb735f86320ad05e4",
  measurementId: "G-5B8XW73ZT4"
};
// ▲▲▲ END OF PASTE ▲▲▲

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
export const db = getFirestore(app);
export const auth = getAuth(app); // Initialize Auth and export it


