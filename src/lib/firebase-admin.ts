
// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Inicializa o app do Firebase Admin apenas se não houver sido inicializado antes.
// Em ambientes de servidor gerenciados pela Google (como o que este app usa),
// o SDK pode detectar automaticamente as credenciais do ambiente.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
