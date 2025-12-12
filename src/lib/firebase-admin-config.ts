
import admin from 'firebase-admin';
import { getApps, App, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;

if (getApps().length === 0) {
  try {
    // Monta o objeto de credencial a partir das variáveis de ambiente
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // A chave privada precisa de um tratamento para substituir '\\n' por '\n'
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    // Verifica se os campos essenciais foram preenchidos
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error(
        "As variáveis de ambiente do Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão definidas no arquivo .env. Por favor, preencha-as com os valores do seu JSON de credenciais."
      );
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (error) {
    console.error(
      'FALHA CRÍTICA AO INICIALIZAR FIREBASE ADMIN:',
      error
    );
    // Em caso de falha, inicializamos uma app "vazia" para evitar que o sistema quebre,
    // mas as chamadas ao banco de dados falharão, o que é o comportamento esperado.
    adminApp = admin.initializeApp();
  }
} else {
  adminApp = admin.app();
}

adminDb = getFirestore(adminApp);
adminAuth = getAuth(adminApp);

export { admin, adminDb, adminAuth };
