// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import getAuth here

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBafBv2UojhGRQjeiZoG4ES7O19jZ6OZvU",
  authDomain: "mathmate-ahc-app.firebaseapp.com",
  projectId: "mathmate-ahc-app",
  storageBucket: "mathmate-ahc-app.firebasestorage.app",
  messagingSenderId: "324907269101",
  appId: "1:324907269101:web:5ec3feb735f86320ad05e4",
  measurementId: "G-5B8XW73ZT4"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize services ONCE and export them
export const db = getFirestore(app);
export const auth = getAuth(app);

