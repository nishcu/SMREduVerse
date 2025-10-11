import 'dotenv/config';
import * as admin from 'firebase-admin';

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set.');
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Re-throw the error to make the failure explicit
    throw new Error(`Could not initialize Firebase Admin SDK: ${error.message}`);
  }
}

export const getAdminDb = () => {
    const app = getFirebaseAdmin();
    return admin.firestore(app);
};
export const getAdminAuth = () => {
    const app = getFirebaseAdmin();
    return admin.auth(app);
};
export const getAdminStorage = () => {
    const app = getFirebaseAdmin();
    return admin.storage(app);
};
