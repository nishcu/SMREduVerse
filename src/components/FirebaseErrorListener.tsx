
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { XCircle } from 'lucide-react';

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      console.error('Contextual Firestore Error:', err);
      setError(err);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (!error || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        color: 'white',
      }}
    >
      <div
        style={{
          backgroundColor: '#2a2a2a',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: 'monospace',
          border: '1px solid #ff4444',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: '#ff4444', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={24} /> Firestore Permission Error
          </h2>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
        <p style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap', color: '#cccccc' }}>
          Your request was denied by Firestore Security Rules. This overlay provides context to help you debug your `firestore.rules` file.
        </p>
        <pre
          style={{
            backgroundColor: '#1a1a1a',
            padding: '1rem',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: '0.8rem',
            color: '#f1f1f1',
          }}
        >
          {error.message.replace('FirestoreError: Missing or insufficient permissions: ', '')}
        </pre>
      </div>
    </div>
  );
}
