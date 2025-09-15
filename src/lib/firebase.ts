
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNNVPGCjX-0PJathtQF1mRBZQzDpv1KVk",
  authDomain: "studio-19544357-e5b7b.firebaseapp.com",
  projectId: "studio-19544357-e5b7b",
  storageBucket: "studio-19544357-e5b7b.firebasestorage.app",
  messagingSenderId: "253320578749",
  appId: "1:253320578749:web:f5dbbe818c2e92d9f319d4"
};

// Initialize Firebase
// Avoid re-initializing on Next.js hot-reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
