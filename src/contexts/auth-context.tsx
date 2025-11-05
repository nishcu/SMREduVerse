'use client';

import { createContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
      if (user) {
        // Set Firebase user immediately for instant UI update
        setFirebaseUser(user);
        setLoading(false); // Stop loading immediately - don't wait for profile
        
        // Store idToken in a cookie (non-blocking)
        user.getIdToken().then(token => {
            document.cookie = `idToken=${token}; path=/; max-age=3600`; // Expires in 1 hour
        }).catch(() => {
          // Silent fail - token will be fetched when needed
        });
        
        // Fetch profile in background (non-blocking)
        const userRef = doc(db, `users/${user.uid}/profile/${user.uid}`);
        
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
            
            // Create profile in background - don't await
            setDoc(userRef, { ...newUser, createdAt: serverTimestamp() }).catch(err => {
              console.error("Error creating user profile:", err);
            });
            
            // Set user immediately with new profile data
            setUser({ id: user.uid, ...newUser });
          }
        } catch (error: any) {
            console.error("Error fetching or creating user profile:", error);
            // Don't block login if profile creation fails, but log the error
            // User can still use the app with basic Firebase user data
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
        document.cookie = 'idToken=; path=/; max-age=0'; // Clear cookie on logout
      }
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

      await setDoc(userRef, { ...newUser, createdAt: serverTimestamp() });
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
