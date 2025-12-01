import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';

// This function ensures that the Firebase app is initialized only once.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export { app };
