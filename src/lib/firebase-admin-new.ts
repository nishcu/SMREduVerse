import 'dotenv/config';
import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set. Please check your .env file.');
    }

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
    });
    console.log('Firebase Admin SDK initialized successfully');
    return app;

  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Re-throw the error to make the failure explicit
    throw new Error(`Could not initialize Firebase Admin SDK: ${error.message}`);
  }
}

const adminApp = initializeFirebaseAdmin();

export const getAdminDb = () => admin.firestore(adminApp);
export const getAdminAuth = () => admin.auth(adminApp);
export const getAdminStorage = () => admin.storage(adminApp);
