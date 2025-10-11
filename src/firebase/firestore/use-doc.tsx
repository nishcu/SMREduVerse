'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function useDoc<T>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null);
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore doc error on path ${ref.path}:`, err);
         toast({
            variant: 'destructive',
            title: 'Error loading data',
            description: `Could not fetch data from ${ref.path}. You may not have the required permissions.`
        })
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref?.path]);

  return { data, loading, error };
}
