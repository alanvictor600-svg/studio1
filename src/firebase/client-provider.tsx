"use client";
import { createContext, useContext, ReactNode } from 'react';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Define the shape of the context value
interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

// A single instance of the Firebase app is created and memoized.
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

// Initialize Auth and Firestore services once
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


export const FirebaseClientProvider = ({ children }: { children: ReactNode }) => {
  // The value is stable because firebaseApp and services are created only once.
  const value = { firebaseApp, auth, db };
  
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseClientProvider");
  }
  return context;
};
