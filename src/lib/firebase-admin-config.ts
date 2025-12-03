import admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

interface AdminAppOptions {
    credential?: admin.credential.Credential;
    projectId?: string;
}

let options: AdminAppOptions = {};

// This is the Vercel production environment
if (process.env.VERCEL_ENV === 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
        const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        options = {
            credential: admin.credential.cert(serviceAccount)
        };
    } catch (e) {
        console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    }
} 
// This is for local development or other environments that use Application Default Credentials (ADC)
// e.g., by running `gcloud auth application-default login`
else if (!process.env.VERCEL_ENV) {
     options = {
        projectId: firebaseConfig.projectId,
     };
}
// For other Vercel environments (like preview deployments), we also rely on ADC
// which can be configured via Vercel's "Integrations" tab with Google Cloud.
else {
     options = {
        projectId: firebaseConfig.projectId,
     };
}

export const adminOptions = options;
