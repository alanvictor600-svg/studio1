// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

// Esta função garante que a chave privada, que pode vir com quebras de linha `\n`, seja formatada corretamente.
const formatPrivateKey = (key: string | undefined) => {
    if (!key) {
        return undefined;
    }
    return key.replace(/\\n/g, '\n');
}

// Monta o objeto de credenciais usando as variáveis de ambiente.
// Isso evita a necessidade de um arquivo JSON no servidor, o que é mais seguro.
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Verifica se as credenciais essenciais estão presentes
if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
    console.error("Credenciais do Firebase Admin não estão completamente configuradas nas variáveis de ambiente.");
} else {
    // Inicializa o app do Firebase Admin apenas se não houver sido inicializado antes.
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
      });
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
