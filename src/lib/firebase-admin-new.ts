import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

function initializeFirebaseAdmin() {
  if (app) {
    return app;
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase admin environment variables are not set.');
    }

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
    });
    console.log('Firebase Admin SDK initialized successfully');
    return app;

  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    // Return a dummy object or handle appropriately
    return {
      auth: () => { throw new Error("Admin Auth not initialized"); },
      firestore: () => { throw new Error("Admin Firestore not initialized"); },
    } as unknown as admin.app.App;
  }
}

const adminApp = initializeFirebaseAdmin();

export const getAdminDb = () => admin.firestore(adminApp);
export const getAdminAuth = () => admin.auth(adminApp);
export const getAdminStorage = () => admin.storage(adminApp);
