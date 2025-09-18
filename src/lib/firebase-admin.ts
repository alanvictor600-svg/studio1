// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  // Validate that all required environment variables are present before initializing.
  if (!projectId || !clientEmail || !privateKeyBase64) {
    throw new Error(
      'Firebase admin credentials not found. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY_BASE64 are set.'
    );
  }

  // Decode the Base64 private key
  const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('ascii');
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
