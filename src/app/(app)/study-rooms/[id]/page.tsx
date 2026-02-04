
'use client';
import { doc, DocumentReference } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { useDoc } from '@/firebase';
import { db } from '@/lib/firebase';
import { useMemo } from 'react';
import type { StudyRoom } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatWindow } from '@/components/chat/chat-window';
import { useAuth } from '@/hooks/use-auth';

export default function StudyRoomPage({ params }: { params: { id: string } }) {
  const { user, loading: userLoading } = useAuth();
  
  const roomRef = useMemo(() => doc(db, 'study-rooms', params.id), [params.id]);
  const { data: room, loading: roomLoading } = useDoc<StudyRoom>(roomRef as DocumentReference<StudyRoom> | null);

  const loading = userLoading || roomLoading;

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-[70vh] w-full" />
        </div>
    )
  }

  if (!room) {
    notFound();
  }

  return (
    <div className="space-y-4 h-[calc(100vh-10rem)] flex flex-col">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          {room.name}
        </h1>
        <p className="text-muted-foreground">
          Hosted by {room.hostName} | {room.subject}
        </p>
      </div>
      <div className="flex-grow">
        <ChatWindow chatId={room.id} />
      </div>
    </div>
  );
}
