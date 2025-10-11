
'use client';
import { useParams } from 'next/navigation';
import { useDoc } from '@/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { useMemo } from 'react';
import { PostsFeed } from '@/app/(app)/social/posts-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Brain, Bike, School as SchoolIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

  const userRef = useMemo(() => (uid ? (doc(db, 'users', uid, 'profile', uid) as DocumentReference<User>) : null), [uid]);
  const { data: profile, loading } = useDoc<User>(userRef);

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2">
            {/* In a real implementation, PostsFeed would be filtered by the user's ID. */}
            <PostsFeed />
        </div>
        {profile && (
            <div className="md:col-span-1">
                <ProfileDetails user={profile} />
            </div>
        )}
    </div>
  );
}
