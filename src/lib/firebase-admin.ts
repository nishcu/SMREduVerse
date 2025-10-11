
'use server';

import admin from 'firebase-admin';
import serviceAccountKey from '../../serviceAccountKey.json';

// Keep these as singletons so Firebase Admin isn't re-initialized multiple times
let auth: admin.auth.Auth | undefined;
let db: admin.firestore.Firestore | undefined;
let storage: admin.storage.Storage | undefined;

function initializeFirebaseAdmin() {
  // If already initialized, just reuse
  if (admin.apps.length > 0) {
    if (!auth) auth = admin.auth();
    if (!db) db = admin.firestore();
    if (!storage) storage = admin.storage();
    return;
  }

  try {
    // The type assertion is necessary because the JSON file is imported directly.
    const serviceAccount = serviceAccountKey as admin.ServiceAccount;

    // Initialize the Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    auth = admin.auth();
    db = admin.firestore();
    storage = admin.storage();

    console.log('✅ Firebase Admin SDK initialized successfully.');
  } catch (e: any) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', e.message);
    auth = undefined;
    db = undefined;
    storage = undefined;
  }
}

export async function getFirebaseAdmin() {
  if (!auth || !db) {
    initializeFirebaseAdmin();
  }
  return { auth, db, storage };
}
