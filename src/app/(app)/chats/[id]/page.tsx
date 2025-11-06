'use client';

import { useMemo } from 'react';
import { useDoc } from '@/firebase';
import { db } from '@/lib/firebase';
import type { Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedChatWindow } from '@/components/chat/enhanced-chat-window';
import { useAuth } from '@/hooks/use-auth';
import { notFound, useParams } from 'next/navigation';
import { doc, DocumentReference } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Circle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { user, loading: userLoading } = useAuth();

  const chatRef = useMemo(
    () => (chatId ? (doc(db, 'chats', chatId) as DocumentReference<Chat>) : null),
    [chatId]
  );

  const { data: chat, loading: chatLoading, error } = useDoc<Chat>(chatRef);

  const loading = userLoading || chatLoading;

  if (loading) {
    console.log('ChatPage loading:', { userLoading, chatLoading, chatId, user: user?.id });
    return (
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex-grow p-4 space-y-4">
          <Skeleton className="h-12 w-3/5" />
          <Skeleton className="h-12 w-3/5 ml-auto" />
          <Skeleton className="h-12 w-2/5" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !chat) {
    console.warn('Chat fetch failed:', { error: error?.message, chatId });
    return (
      <Card className="h-full flex flex-col items-center justify-center p-4 text-destructive">
        <p>Unable to load chat. Please check your permissions or try again later.</p>
      </Card>
    );
  }

  if (!user || !chat.participants.includes(user.id)) {
    console.warn(
      `Access denied for chat ${chatId}: User ${user?.id || 'unauthenticated'} not in participants`,
      { participants: chat.participants }
    );
    notFound();
  }

  const otherParticipant = useMemo(() => {
    if (chat.type === 'group') return null;
    return chat.participantDetails
      ? Object.values(chat.participantDetails).find((p) => p.uid !== user.id)
      : null;
  }, [chat, user]);

  const chatName = useMemo(() => {
    if (chat.type === 'group') {
      return chat.name || `Group Chat (${chat.participants.length})`;
    }
    return otherParticipant?.name || 'Private Chat';
  }, [chat, otherParticipant]);

  // Get online status for private chats
  const presenceRef = useMemo(
    () => otherParticipant?.uid ? (doc(db, 'presence', otherParticipant.uid) as DocumentReference<any>) : null,
    [otherParticipant?.uid]
  );
  const { data: presence } = useDoc<any>(presenceRef);
  const isOnline = presence?.status === 'online';

  const chatDescription = useMemo(() => {
    if (chat.type === 'group') {
      return (
        chat.description || `Group chat with ${chat.participants.length} members`
      );
    }
    const statusText = isOnline ? 'Online' : presence?.lastSeen 
      ? `Last seen ${formatDistanceToNow(presence.lastSeen.toDate(), { addSuffix: true })}`
      : 'Offline';
    return statusText;
  }, [chat, isOnline, presence]);

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center gap-3 bg-background">
        <div className="relative">
          {chat.type === 'group' && chat.photoUrl ? (
            <Avatar className="h-10 w-10">
              <AvatarImage src={chat.photoUrl} alt="Group avatar" />
              <AvatarFallback>{getInitials(chat.name || 'Group')}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.avatarUrl} alt={otherParticipant?.name} />
              <AvatarFallback>{getInitials(otherParticipant?.name || '?')}</AvatarFallback>
            </Avatar>
          )}
          {chat.type === 'private' && isOnline && (
            <div className="absolute bottom-0 right-0">
              <Circle className="h-3 w-3 fill-green-500 text-green-500 border-2 border-background rounded-full" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg truncate">{chatName}</h1>
          <p className="text-sm text-muted-foreground truncate">{chatDescription}</p>
        </div>
      </div>
      <div className="flex-grow">
        <EnhancedChatWindow chatId={chat.id} chat={chat} />
      </div>
    </Card>
  );
}