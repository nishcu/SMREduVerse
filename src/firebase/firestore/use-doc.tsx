'use client';
import { useState, useEffect, useRef } from 'react';
import { onSnapshot, type DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function useDoc<T>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Clean up previous listener if it exists
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch (err) {
        // Ignore cleanup errors
      }
      unsubscribeRef.current = null;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null);
          setLoading(false);
        },
        (err) => {
          // Only show toast for non-permission errors to avoid spam
          if (err.code !== 'permission-denied') {
            toast({
              variant: 'destructive',
              title: 'Error loading data',
              description: `Could not fetch data from ${ref.path}. You may not have the required permissions.`
            });
          }
          setError(err);
          setLoading(false);
        }
      );
      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          // Ignore cleanup errors
        }
        unsubscribeRef.current = null;
      }
    };
  }, [ref?.path, toast]);

  return { data, loading, error };
}
