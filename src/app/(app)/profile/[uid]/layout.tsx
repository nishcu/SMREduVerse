'use client';

import { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useDoc } from '@/firebase';
import { db } from '@/lib/firebase';
import { doc, DocumentReference } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { ProfileHeader } from '@/components/profile-header';
import { Skeleton } from '@/components/ui/skeleton';

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton className="h-32 w-32 rounded-full" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 border-b">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const uid = params.uid as string;

  const userRef = useMemo(
    () => (uid ? (doc(db, 'users', uid, 'profile', uid) as DocumentReference<User>) : null),
    [uid]
  );
  const { data: profile, loading, error } = useDoc<User>(userRef);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <ProfileHeader user={profile} />
      <div>{children}</div>
    </div>
  );
}
