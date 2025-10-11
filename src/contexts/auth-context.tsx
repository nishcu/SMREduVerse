
'use client';

import { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getInitials: (name: string) => string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to generate a random referral code
const generateReferralCode = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setFirebaseUser(user);
        const userRef = doc(db, `users/${user.uid}/profile/${user.uid}`);
        
        // Store idToken in a cookie
        user.getIdToken().then(token => {
            document.cookie = `idToken=${token}; path=/; max-age=3600`; // Expires in 1 hour
        });
        
        try {
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser({ id: user.uid, ...userSnap.data() } as User);
          } else {
             // Check if the new user is the designated super admin
            const isSuperAdmin = user.uid === 'hJ1yy9A2WDZWPM9RPYquq8ibCp22';

            // Create a new user profile document if it doesn't exist
            const newUser: Omit<User, 'id'> = {
              name: user.displayName || user.email?.split('@')[0] || 'New User',
              username: user.email?.split('@')[0] || `user${Date.now()}`,
              email: user.email || '',
              avatarUrl: user.photoURL || `https://avatar.vercel.sh/${user.uid}`,
              bio: 'Welcome to the platform! Update your bio.',
              isSuperAdmin: isSuperAdmin,
              followersCount: 0,
              followingCount: 0,
              createdAt: new Date().toISOString(),
              referralCode: generateReferralCode(8),
              settings: {
                restrictSpending: false,
                restrictChat: false,
                restrictTalentHub: false,
              },
              wallet: {
                knowledgeCoins: 100, // Starting balance
              },
              knowledgePoints: 100, // Lifetime points start at 100
              grade: 'Not specified',
              educationHistory: [],
              syllabus: 'Not specified',
              medium: 'Not specified',
              interests: [],
              sports: [],
            };
            
            // Do not await here, use catch for error handling
            setDoc(userRef, { ...newUser, createdAt: serverTimestamp() })
              .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                  path: userRef.path,
                  operation: 'create',
                  requestResourceData: newUser,
                  auth: { uid: user.uid },
                });
                errorEmitter.emit('permission-error', permissionError);
              });

            setUser({ id: user.uid, ...newUser });
          }
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'get',
                auth: { uid: user.uid },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        document.cookie = 'idToken=; path=/; max-age=0'; // Clear cookie on logout
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };
  
  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }

  const signupWithEmail = async (name: string, email: string, password: string) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Manually create the profile since onAuthStateChanged might not have the display name yet.
      const isSuperAdmin = user.uid === 'hJ1yy9A2WDZWPM9RPYquq8ibCp22';
      const userRef = doc(db, `users/${user.uid}/profile/${user.uid}`);

      const newUser: Omit<User, 'id'> = {
        name: name,
        username: email.split('@')[0],
        email: email,
        avatarUrl: `https://avatar.vercel.sh/${user.uid}`,
        bio: 'Welcome to the platform! Update your bio.',
        isSuperAdmin: isSuperAdmin,
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString(),
        referralCode: generateReferralCode(8),
        settings: {
          restrictSpending: false,
          restrictChat: false,
          restrictTalentHub: false,
        },
        wallet: { knowledgeCoins: 100 },
        knowledgePoints: 100,
        grade: 'Not specified',
        educationHistory: [],
        syllabus: 'Not specified',
        medium: 'Not specified',
        interests: [],
        sports: [],
      };

      setDoc(userRef, { ...newUser, createdAt: serverTimestamp() }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'create',
          requestResourceData: newUser,
          auth: { uid: user.uid },
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      setUser({ id: user.uid, ...newUser });
  };

  const logout = async () => {
    await auth.signOut();
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
  };

  const contextValue = useMemo(
    () => ({
      user,
      firebaseUser,
      loading,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      logout,
      getInitials,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, firebaseUser, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
