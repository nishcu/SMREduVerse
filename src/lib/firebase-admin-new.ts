
import 'dotenv/config';
import * as admin from 'firebase-admin';

// A more robust singleton pattern for Firebase Admin in a serverless environment.
// This uses a global symbol to store the app instance, preventing re-initialization
// across module reloads in development.
const APP_INSTANCE_KEY = Symbol.for('firebase_admin_app');

function getFirebaseAdmin() {
  const globalWithApp = global as typeof globalThis & {
    [APP_INSTANCE_KEY]?: admin.app.App;
  };

  if (globalWithApp[APP_INSTANCE_KEY]) {
    return globalWithApp[APP_INSTANCE_KEY];
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

    console.log('Initializing new Firebase Admin SDK instance...');
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    globalWithApp[APP_INSTANCE_KEY] = app;
    return app;

  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Re-throw the error to make the failure explicit
    throw new Error(`Could not initialize Firebase Admin SDK: ${error.message}`);
  }
}

export const getAdminDb = () => admin.firestore(getFirebaseAdmin());
export const getAdminAuth = () => admin.auth(getFirebaseAdmin());
export const getAdminStorage = () => admin.storage(getFirebaseAdmin());
