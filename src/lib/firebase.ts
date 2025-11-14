// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// As variáveis de ambiente agora são carregadas pelo next.config.js,
// então não é mais necessário carregar 'dotenv' aqui.

// Your web app's Firebase configuration is now loaded from environment variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// This function ensures Firebase is initialized only once.
const initializeFirebase = (): { app: FirebaseApp; auth: Auth; db: Firestore } => {
  // This check is now more critical. If it's false here, the .env wasn't read by next.config.js.
  if (!firebaseConfig.apiKey) {
      throw new Error("CONFIGURAÇÃO DO FIREBASE AUSENTE. Verifique se o arquivo .env existe, está na raiz do projeto e foi preenchido corretamente.");
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
};

const { app, auth, db } = initializeFirebase();

export { app, auth, db };
