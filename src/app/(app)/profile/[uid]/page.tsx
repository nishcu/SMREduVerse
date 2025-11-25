
'use client';
import { useParams } from 'next/navigation';
import { useDoc } from '@/firebase';
import { doc, DocumentReference, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { PostsFeed } from '@/app/(app)/social/posts-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Brain, Bike, School as SchoolIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to generate a random referral code
const generateReferralCode = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function ProfilePageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function ProfileDetails({ user }: { user: User }) {
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Education History</CardTitle>
            </CardHeader>
            <CardContent>
                {user.educationHistory && user.educationHistory.length > 0 ? (
                    <ul className="space-y-4">
                        {user.educationHistory.map(edu => (
                            <li key={edu.id} className="flex gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                                    <SchoolIcon className="h-5 w-5 text-secondary-foreground" />
                                </div>
                                <div>
                                    <p className="font-semibold">{edu.name}</p>
                                    <p className="text-sm text-muted-foreground">{edu.level}</p>
                                    <p className="text-xs text-muted-foreground">{edu.startYear} - {edu.endYear}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-muted-foreground">No education history listed.</p>
                )}
            </CardContent>
        </Card>
        <Card>
        <CardHeader>
            <CardTitle>Achievements &amp; Interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Award className="h-4 w-4 text-primary"/> Achievements</h4>
            <div className="text-center text-xs text-muted-foreground py-4 border rounded-lg">
                <p>Achievement badges coming soon!</p>
            </div>
            </div>
            <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Brain className="h-4 w-4 text-primary"/> Interests</h4>
            <div className="flex flex-wrap gap-2">
                {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                ))
                ) : (
                <p className="text-xs text-muted-foreground">No interests listed.</p>
                )}
            </div>
            </div>
            <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Bike className="h-4 w-4 text-primary"/> Sports</h4>
            <div className="flex flex-wrap gap-2">
                {user.sports && user.sports.length > 0 ? (
                user.sports.map((sport) => (
                    <Badge key={sport} variant="secondary">{sport}</Badge>
                ))
                ) : (
                <p className="text-xs text-muted-foreground">No sports listed.</p>
                )}
            </div>
            </div>
        </CardContent>
        </Card>
    </div>
  )
}

export default function ProfilePage() {
  const params = useParams();
  const uid = params.uid as string;
  const { user: currentUser, firebaseUser } = useAuth();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const userRef = useMemo(() => (uid ? (doc(db, 'users', uid, 'profile', uid) as DocumentReference<User>) : null), [uid]);
  const { data: profile, loading } = useDoc<User>(userRef);

  // Auto-create profile if it doesn't exist and user is viewing their own profile
  useEffect(() => {
    if (!loading && !profile && uid === currentUser?.id && firebaseUser && !isCreatingProfile) {
      setIsCreatingProfile(true);
      const createProfile = async () => {
        try {
          const isSuperAdmin = firebaseUser.uid === 'hJ1yy9A2WDZWPM9RPYquq8ibCp22';
          
          const newUser: Omit<User, 'id'> = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            username: firebaseUser.email?.split('@')[0] || `user${Date.now()}`,
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.uid}`,
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
              knowledgeCoins: 100,
            },
            knowledgePoints: 100,
            grade: 'Not specified',
            educationHistory: [],
            syllabus: 'Not specified',
            medium: 'Not specified',
            interests: [],
            sports: [],
          };
          
          await setDoc(userRef!, { id: firebaseUser.uid, ...newUser, createdAt: serverTimestamp() });
          // Profile will be loaded by useDoc hook after creation
        } catch (error) {
          console.error("Error creating profile:", error);
        } finally {
          setIsCreatingProfile(false);
        }
      };
      
      createProfile();
    }
  }, [loading, profile, uid, currentUser?.id, firebaseUser, userRef, isCreatingProfile]);

  if (loading || isCreatingProfile) {
    return <ProfilePageSkeleton />;
  }

  // If profile doesn't exist and it's not the current user's profile
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-lg text-muted-foreground">Profile not found</p>
        <p className="text-sm text-muted-foreground">
          {uid === currentUser?.id 
            ? "Creating your profile..."
            : "This user profile doesn't exist."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
            {/* In a real implementation, PostsFeed would be filtered by the user's ID. */}
            <PostsFeed />
        </div>
        <div className="md:col-span-1">
            <ProfileDetails user={profile} />
        </div>
    </div>
  );
}
