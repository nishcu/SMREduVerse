import * as admin from 'firebase-admin';

// Log to confirm import
console.log('firebase-admin-new: firebase-admin imported:', !!admin);

function getFirebaseAdmin() {
  if (admin.apps.length > 0 && admin.apps[0]) {
    const app = admin.apps[0];
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

    // Validate private key format
    if (!requiredVars.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('getFirebaseAdmin: Invalid FIREBASE_PRIVATE_KEY format');
      throw new Error('Invalid FIREBASE_PRIVATE_KEY format');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: requiredVars.projectId,
        clientEmail: requiredVars.clientEmail,
        privateKey: requiredVars.privateKey.replace(/\\n/g, '\n'),
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
