// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    "projectId": "studio-19544357-e5b7b",
    "appId": "1:253320578749:web:f5dbbe818c2e92d9f319d4",
    "storageBucket": "studio-19544357-e5b7b.firebasestorage.app",
    "apiKey": "AIzaSyDNNVPGCjX-0PJathtQF1mRBZQzDpv1KVk",
    "authDomain": "studio-19544357-e5b7b.firebaseapp.com",
    "measurementId": "",
    "messagingSenderId": "253320578749"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
