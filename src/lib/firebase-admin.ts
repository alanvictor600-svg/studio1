// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Import the service account key directly
import serviceAccount from './firebase-service-account.json';

// Verifica se o app já foi inicializado para evitar reinicializações
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
