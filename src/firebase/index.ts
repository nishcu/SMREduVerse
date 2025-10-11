'use client';
// Use barrel file to export all Firebase-related functionality

// Main Firebase app and services
export * from '../lib/firebase';

// Custom hooks for Firestore data
export * from './firestore/use-collection';
export * from './firestore/use-doc';

// Exporting `useAuth` from `hooks` to keep all user-facing hooks consistent
export * from '../hooks/use-auth';
