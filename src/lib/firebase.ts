// src/lib/firebase.ts
"use client"; // Garante que este módulo seja executado apenas no cliente

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-client"; // Import from the new client config file

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: Firestore;

// A inicialização do Firebase agora só acontece no lado do cliente
if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    // Validate that the essential Firebase config values are present.
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
} else {
  // No servidor, exportamos placeholders ou nulos para evitar erros.
  // O código que os utiliza deve ser executado apenas no cliente.
  app = null as any;
  auth = null as any;
  db = null as any;
}


export { app, auth, db };
