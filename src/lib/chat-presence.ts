'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useEffect, useRef } from 'react';

// Track user online status
export function usePresence() {
  const presenceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (presenceRef.current) {
        // Fire-and-forget; we don't await inside unload handler
        presenceRef.current().catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userStatusRef = doc(db, 'presence', user.uid);
        
        try {
          // Set user as online
          await setDoc(userStatusRef, {
            status: 'online',
            lastSeen: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          // Silently fail if permissions are missing - presence is optional
          console.debug('Could not update presence status:', error);
        }

        // Set user as offline when they disconnect
        const markOffline = async () => {
          try {
            await setDoc(userStatusRef, {
              status: 'offline',
              lastSeen: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });
          } catch (error) {
            // Silently fail if permissions are missing
            console.debug('Could not mark user offline:', error);
          }
        };

        presenceRef.current = markOffline;
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (presenceRef.current) {
        presenceRef.current().catch(() => {});
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

