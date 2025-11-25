// This file is for client-side Firebase initialization
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCjiBKKDIylbYFAi0aNYxgSYkviWPAF_ww",
  authDomain: "studio-4485772157-5c03f.firebaseapp.com",
  projectId: "studio-4485772157-5c03f",
  storageBucket: "studio-4485772157-5c03f.appspot.com",
  messagingSenderId: "639742127067",
  appId: "1:639742127067:web:9db7a19cced9e33cb5d5fe"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
