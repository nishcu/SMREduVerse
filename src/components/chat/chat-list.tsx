
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from '@/firebase';
import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getInitials } from '@/lib/utils';


function ChatListItemSkeleton() {
    return (
        <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    )
}

export function ChatList() {
    const { user, loading: authLoading } = useAuth();
    const pathname = usePathname();

    const chatsQuery = useMemo(
        () => user ? query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.id),
            orderBy('lastMessage.timestamp', 'desc')
        ) : null,
        [user?.id]
    );
    const { data: chats, loading: chatsLoading, error } = useCollection<Chat>(chatsQuery);
    
    const isLoading = authLoading || chatsLoading;

    if (isLoading) {
        return (
            <div className="space-y-2">
                <ChatListItemSkeleton />
                <ChatListItemSkeleton />
                <ChatListItemSkeleton />
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex h-full items-center justify-center text-center text-destructive p-4">
                <p>Error loading conversations: <br /> {error.message}</p>
            </div>
        )
    }

    if (!chats || chats.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground p-4">
                <p>No conversations yet. <br /> Start a chat from a user's profile.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <ul className="space-y-1">
                {chats.map((chat) => {
                    const otherParticipant = chat.type === 'private' 
                        ? Object.values(chat.participantDetails || {}).find(p => p.uid !== user?.id)
                        : null;

                    const chatName = chat.type === 'group' ? chat.name : otherParticipant?.name;
                    const avatarUrl = chat.type === 'group' ? chat.photoUrl : otherParticipant?.avatarUrl;
                    
                    const isActive = pathname.includes(chat.id);

                    return (
                        <li key={chat.id}>
                            <Link href={`/chats/${chat.id}`} className={cn(
                                "block rounded-lg p-3 transition-colors",
                                isActive ? "bg-secondary" : "hover:bg-secondary/50"
                            )}>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={avatarUrl} alt={chatName} />
                                        <AvatarFallback>{getInitials(chatName || '?')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between">
                                            <p className="font-semibold truncate">{chatName}</p>
                                            {chat.lastMessage?.timestamp && (
                                                 <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {chat.lastMessage?.senderId === user?.id && 'You: '}{chat.lastMessage?.content || 'No messages yet...'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
}
