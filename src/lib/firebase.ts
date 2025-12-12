
// src/lib/firebase.ts
"use client"; 

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-client";

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: Firestore;

function initializeFirebase() {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error(
        "Firebase configuration is incomplete. " +
        "Please ensure that NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in your environment variables."
      );
    }
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

// Ensure initialization only happens on the client
if (typeof window !== 'undefined') {
  initializeFirebase();
} else {
  // Provide mock instances for server-side rendering to avoid errors
  app = null as any;
  auth = null as any;
  db = null as any;
}

export { app, auth, db };
