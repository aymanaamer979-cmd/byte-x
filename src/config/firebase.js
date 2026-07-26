import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // 🎯 أضفنا GoogleAuthProvider هنا
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCI6urXMzPqMap4ds-cR_DRObbo7592WqE",
  authDomain: "byte-x-cf8a2.firebaseapp.com",
  databaseURL: "https://byte-x-cf8a2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "byte-x-cf8a2",
  storageBucket: "byte-x-cf8a2.firebasestorage.app",
  messagingSenderId: "242067083133",
  appId: "1:242067083133:web:a646c06b1170960fdf0614",
  measurementId: "G-WY4J444K7F"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider(); // 🎯 تصدير محرك جوجل