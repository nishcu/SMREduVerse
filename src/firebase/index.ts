// Use barrel file to export all Firebase-related functionality

// Main Firebase app and services
export * from '../lib/firebase';

// Custom hooks for Firestore data
export * from './firestore/use-collection';
export * from './firestore/use-doc';

// Error handling utilities
export * from './error-emitter';
export * from './errors';

// Exporting `useAuth` from `hooks` to keep all user-facing hooks consistent
export * from '../hooks/use-auth';
