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
    if (!firebaseConfig.apiKey) {
      throw new Error("Firebase API Key is missing. Check your environment variables.");
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
