
// src/lib/firebase.ts
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

// This function is the single source of truth for the Firebase app instance.
// It ensures that Firebase is initialized only once.
function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    // This check will now only run in the browser, inside a useEffect,
    // where the environment variables are guaranteed to be available.
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

// We are no longer exporting the instances directly to prevent
// module-level execution. Instead, the AuthProvider will manage this.
// These functions are kept here in case other client components need them,
// but for now, they are not used directly.
function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseApp());
}

function getFirebaseFirestore(): Firestore {
    return getFirestore(getFirebaseApp());
}

// Re-exporting for potential use in other client components.
export const app = getFirebaseApp; // Exporting the function itself
export const db = getFirebaseFirestore;
export const auth = getFirebaseAuth;

      