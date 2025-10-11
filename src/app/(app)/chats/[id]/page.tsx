'use client';

import { useMemo } from 'react';
import { useDoc } from '@/firebase';
import { db } from '@/lib/firebase';
import type { Chat } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatWindow } from '@/components/chat/chat-window';
import { useAuth } from '@/hooks/use-auth';
import { notFound, useParams } from 'next/navigation';
import { doc, DocumentReference } from 'firebase/firestore';
import { Card } from '@/components/ui/card';

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

  const chatName = useMemo(() => {
    if (chat.type === 'group') {
      return chat.name || `Group Chat (${chat.participants.length})`;
    }
    const otherParticipant = chat.participantDetails
      ? Object.values(chat.participantDetails).find((p) => p.uid !== user.id)
      : null;
    return otherParticipant?.name || 'Private Chat';
  }, [chat, user]);

  const chatDescription = useMemo(() => {
    if (chat.type === 'group') {
      return (
        chat.description || `Group chat with ${chat.participants.length} members`
      );
    }
    return `A conversation with ${chatName}${chat.lastMessage ? ` · Last: ${chat.lastMessage.content.slice(0, 30)}...` : ''}`;
  }, [chat, chatName]);

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center gap-3">
        {chat.type === 'group' && chat.photoUrl ? (
          <img src={chat.photoUrl} alt="Group avatar" className="w-10 h-10 rounded-full" />
        ) : (
          chat.type === 'private' &&
          chat.participantDetails &&
          Object.values(chat.participantDetails).find((p) => p.uid !== user.id)?.avatarUrl && (
            <img
              src={Object.values(chat.participantDetails).find((p) => p.uid !== user.id)!.avatarUrl}
              alt="Participant avatar"
              className="w-10 h-10 rounded-full"
            />
          )
        )}
        <div>
          <h1 className="font-semibold text-lg">{chatName}</h1>
          <p className="text-sm text-muted-foreground">{chatDescription}</p>
        </div>
      </div>
      <div className="flex-grow">
        <ChatWindow chatId={chat.id} chat={chat} />
      </div>
    </Card>
  );
}