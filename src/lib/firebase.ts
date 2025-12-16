
// src/lib/firebase.ts
"use client"; // ESSENCIAL: Garante que este módulo só execute no cliente.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  // Padrão Singleton para inicializar o Firebase apenas uma vez.
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

  db = getFirestore(app);
  auth = getAuth(app);

  // Habilita a persistência offline.
  // Isso ajuda em ambientes com conectividade de rede restrita e melhora a experiência do usuário.
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firebase persistence failed: multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firebase persistence is not available in this browser.');
    }
  });

} catch (e) {
    console.error("Failed to initialize Firebase or enable persistence", e);
    // Se a inicialização falhar, podemos fornecer instâncias 'dummy' ou simplesmente deixar que os erros aconteçam downstream.
    // Por enquanto, vamos logar e permitir que o app falhe, para que o problema seja visível.
    // Em um app de produção, uma estratégia de fallback mais robusta seria necessária.
    throw new Error("Could not initialize Firebase. Please check your configuration and network connection.");
}

// Exporta as instâncias inicializadas para uso em toda a aplicação cliente.
export { db, auth, app };
