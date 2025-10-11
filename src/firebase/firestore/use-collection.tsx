'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type Query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function useCollection<T>(query: Query<T> | null) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
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
        console.error("Firestore collection error:", err);
        toast({
            variant: 'destructive',
            title: 'Error loading data',
            description: 'Could not fetch collection data. You may not have the required permissions.'
        })
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query?.path, query?.converter]); // A simplified dependency array

  return { data, loading, error };
}
