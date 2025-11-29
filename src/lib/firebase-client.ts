
// src/lib/firebase-client.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from '@/firebase/config'; // Import directly from config file

function initializeClientApp(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (getApps().length > 0) {
    const app = getApp();
    return { app, auth: getAuth(app), db: getFirestore(app) };
  }
  
  const app = initializeApp(firebaseConfig);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}

const { app, auth, db } = initializeClientApp();

export { app, auth, db };
