import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Tempelkan object firebaseConfig dari Firebase Console di sini
const firebaseConfig = {
  apiKey: "AIzaSyDZE69lZRoM5WkgB5o97LDcY2XW2smZbUw",
  authDomain: "one-family-9d364.firebaseapp.com",
  projectId: "one-family-9d364",
  storageBucket: "one-family-9d364.firebasestorage.app",
  messagingSenderId: "686577770929",
  appId: "1:686577770929:web:f942fd582f57673d071d90"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Export instance layanan Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;