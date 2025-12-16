// src/lib/firebase.ts
"use client"; // ESSENCIAL: Garante que este módulo só execute no cliente.

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

// Padrão Singleton para inicializar o Firebase apenas uma vez.
let app: FirebaseApp;
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

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

// Exporta as instâncias inicializadas para uso em toda a aplicação cliente.
export { db, auth, app };
