
// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// Inicializa o app do Firebase Admin apenas se não houver sido inicializado antes.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Usar a configuração do projeto diretamente garante consistência
      // e evita problemas com variáveis de ambiente em diferentes ambientes.
      projectId: firebaseConfig.projectId,
      // As credenciais de serviço não são necessárias em muitos ambientes gerenciados
      // pela Google Cloud (como o ambiente em que este app é executado).
      // O SDK Admin pode detectar automaticamente as credenciais.
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
