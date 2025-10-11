
import 'dotenv/config';
import * as admin from 'firebase-admin';

// This is the recommended and most robust way to handle Firebase Admin SDK
// initialization in a serverless environment like Next.js. It ensures that
// the SDK is initialized only once per instance.
function getFirebaseAdmin() {
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
      throw new Error('Firebase admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set.');
    }
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Re-throw the error to make the failure explicit
    throw new Error(`Could not initialize Firebase Admin SDK: ${error.message}`);
  }
}

export const getAdminDb = () => admin.firestore(getFirebaseAdmin());
export const getAdminAuth = () => admin.auth(getFirebaseAdmin());
export const getAdminStorage = () => admin.storage(getFirebaseAdmin());
