// src/lib/firebase.ts
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Singleton pattern to ensure Firebase is only initialized once.
function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
     if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error(
        "Firebase configuration is incomplete. " +
        "Please ensure that NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in your environment variables."
      );
    }
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

// Export functions that retrieve the services, ensuring the app is initialized first.
function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseApp());
}

function getFirebaseFirestore(): Firestore {
    return getFirestore(getFirebaseApp());
}

// Export the service getters
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const app = getFirebaseApp();
