
import { EventEmitter } from 'events';

// Use a global symbol to ensure the emitter is a singleton across modules.
const EMITTER_SYMBOL = Symbol.for('firebase.error.emitter');

// Augment the global object to have our emitter.
declare global {
  var __FIREBASE_ERROR_EMITTER__: EventEmitter;
}

if (!globalThis.__FIREBASE_ERROR_EMITTER__) {
  globalThis.__FIREBASE_ERROR_EMITTER__ = new EventEmitter();
}

export const errorEmitter = globalThis.__FIREBASE_ERROR_EMITTER__;
