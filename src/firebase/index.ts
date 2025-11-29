
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This is the initializeFirebase function for the client-side.
// It ensures that Firebase is only initialized once.
export function initializeFirebase() {
    if (getApps().length > 0) {
        const app = getApp();
        return { app, auth: getAuth(app), firestore: getFirestore(app) };
    }
    
    const app = initializeApp(firebaseConfig);
    return { app, auth: getAuth(app), firestore: getFirestore(app) };
}

// Export the initialized services for direct import where needed,
// though the provider pattern is generally preferred.
const { app, auth, firestore } = initializeFirebase();
export { app, auth, firestore };
