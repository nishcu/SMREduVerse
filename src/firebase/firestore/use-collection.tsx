'use client';
import { useState, useEffect, useRef } from 'react';
import { onSnapshot, type Query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function useCollection<T>(query: Query<T> | null) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
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
        query,
        (snapshot) => {
          const results = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(results);
          setLoading(false);
        },
        (err) => {
          // Only show toast for non-permission errors to avoid spam
          if (err.code !== 'permission-denied') {
            toast({
              variant: 'destructive',
              title: 'Error loading data',
              description: 'Could not fetch collection data. You may not have the required permissions.'
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query?.path, query?.converter, toast]);

  return { data, loading, error };
}
