import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

let firebaseApp = null;

export function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    serviceAccount.private_key = serviceAccount.private_key?.replace(/\\n/g, '\n');
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.applicationDefault();
  }

  if (!credential) {
    console.warn('[Firebase Admin] Credentials missing. Authenticated API routes will return 503 until configured.');
    return null;
  }

  firebaseApp = admin.initializeApp({ credential });
  console.log('[Firebase Admin] Initialized.');
  return firebaseApp;
}

export function getFirebaseAuth() {
  if (!firebaseApp) return null;
  return getAuth(firebaseApp);
}

export { admin };
