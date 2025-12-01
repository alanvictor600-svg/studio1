// src/lib/firebase-client.ts
import { app } from '@/firebase';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This file now safely gets the initialized instances from the provider setup.
// It assumes the Firebase app has already been initialized by FirebaseClientProvider.

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
