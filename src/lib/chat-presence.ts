'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onDisconnect, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useEffect, useRef } from 'react';

// Track user online status
export function usePresence() {
  const presenceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userStatusRef = doc(db, 'presence', user.uid);
        
        // Set user as online
        await setDoc(userStatusRef, {
          status: 'online',
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // Set user as offline when they disconnect
        const disconnectRef = onDisconnect(userStatusRef);
        await disconnectRef.set({
          status: 'offline',
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Store cleanup function
        presenceRef.current = async () => {
          await setDoc(userStatusRef, {
            status: 'offline',
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        };
      }
    });

    return () => {
      unsubscribe();
      if (presenceRef.current) {
        presenceRef.current();
      }
    };
  }, []);
}

// Get user online status
export async function getUserStatus(uid: string): Promise<'online' | 'offline' | 'away' | null> {
  try {
    const statusRef = doc(db, 'presence', uid);
    const statusSnap = await getDoc(statusRef);
    if (statusSnap.exists()) {
      return statusSnap.data().status || 'offline';
    }
    return null;
  } catch (error) {
    console.error('Error getting user status:', error);
    return null;
  }
}

