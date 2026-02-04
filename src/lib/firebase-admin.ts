
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Log to confirm import
console.log('firebase-admin-new: firebase-admin imported:', !!admin);

let app: App | undefined;

function getFirebaseAdmin() {
  if (app) {
    return { app, auth: admin.auth(app), db: admin.firestore(app), storage: admin.storage(app) };
  }
  
  if (admin.apps.length > 0 && admin.apps[0]) {
    app = admin.apps[0];
    return { app, auth: admin.auth(app), db: admin.firestore(app), storage: admin.storage(app) };
  }

  try {
    // Validate environment variables
    const requiredVars = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    };

    // Check for missing variables
    const missingVars = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    if (missingVars.length > 0) {
      console.error('getFirebaseAdmin: Missing environment variables:', missingVars.join(', '));
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    // Normalize private key for various env formats (Vercel, Windows, etc.)
    let normalizedPrivateKey = requiredVars.privateKey!
      // strip surrounding quotes and whitespace
      .replace(/^["'\s]+|["'\s]+$/g, '')
      // convert escaped newlines to actual newlines (when stored as literal \n in env)
      .replace(/\\n/g, '\n')
      // normalize Windows newlines
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    // PEM must start/end with correct headers
    if (!normalizedPrivateKey.includes('-----BEGIN PRIVATE KEY-----') || !normalizedPrivateKey.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key: must contain -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----');
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: requiredVars.projectId!,
        clientEmail: requiredVars.clientEmail!,
        privateKey: normalizedPrivateKey,
      }),
      databaseURL: `https://${requiredVars.projectId}.firebaseio.com`,
    });

    console.log('getFirebaseAdmin: Firebase Admin SDK initialized successfully');
    return { app, auth: admin.auth(app), db: admin.firestore(app), storage: admin.storage(app) };
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(`Could not initialize Firebase Admin SDK: ${error.message}`);
  }
}

export const getAdminDb = () => {
  const { db } = getFirebaseAdmin();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

export const getAdminAuth = () => {
  const { auth } = getFirebaseAdmin();
  if (!auth) {
    throw new Error('Auth not initialized');
  }
  return auth;
};

export const getAdminStorage = () => {
  const { storage } = getFirebaseAdmin();
  if (!storage) {
    throw new Error('Storage not initialized');
  }
  return storage;
};

export { getFirebaseAdmin };
