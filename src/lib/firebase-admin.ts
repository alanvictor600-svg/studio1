// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Decode the private key which is stored in a single line in environment variables
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Check if the required environment variables are set
if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
    console.error("Firebase admin credentials not set in environment variables.");
    // In a real app, you might throw an error here or handle it differently.
    // For the build process, we'll proceed, but it might fail later if admin features are used at build time.
}

// Construct the service account object from environment variables
// This avoids needing a JSON file, which is better for security and deployment
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};


// Verifica se o app já foi inicializado para evitar reinicializações
if (!admin.apps.length) {
  admin.initializeApp({
    // Use the constructed service account object
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
