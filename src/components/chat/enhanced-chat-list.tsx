'use client';
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useDoc } from '@/firebase';
import { useMemo } from 'react';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

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

export function EnhancedChatList() {
    const { user, loading: authLoading } = useAuth();
    const pathname = usePathname();

    // Note: orderBy with array-contains requires an index, so we'll sort in memory
    const chatsQuery = useMemo(
        () => user ? query(
            collection(db, 'chats'),
            where('participants', 'array-contains', user.id)
        ) : null,
        [user?.id]
    );
    const { data: chatsRaw, loading: chatsLoading, error } = useCollection<Chat>(chatsQuery);
    
    // Sort chats by lastMessage timestamp in memory (to avoid index requirement)
    const chats = useMemo(() => {
        if (!chatsRaw) return [];
        return [...chatsRaw].sort((a, b) => {
            const aTime = a.lastMessage?.timestamp?.toDate?.()?.getTime() || 0;
            const bTime = b.lastMessage?.timestamp?.toDate?.()?.getTime() || 0;
            return bTime - aTime; // Newest first
        });
    }, [chatsRaw]);
    
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
                    const otherParticipantId = chat.type === 'private' ? otherParticipant?.uid : null;
                    const unreadCount = user?.id ? (chat.unreadCount?.[user.id] || 0) : 0;
                    
                    const isActive = pathname.includes(chat.id);

                    return (
                        <li key={chat.id}>
                            <ChatListItem
                                chat={chat}
                                chatName={chatName || 'Unknown'}
                                avatarUrl={avatarUrl}
                                otherParticipantId={otherParticipantId}
                                unreadCount={unreadCount}
                                isActive={isActive}
                                lastMessage={chat.lastMessage}
                                user={user}
                            />
                        </li>
                    )
                })}
            </ul>
        </div>
    );
}

function ChatListItem({
    chat,
    chatName,
    avatarUrl,
    otherParticipantId,
    unreadCount,
    isActive,
    lastMessage,
    user,
}: {
    chat: Chat;
    chatName: string;
    avatarUrl?: string;
    otherParticipantId?: string;
    unreadCount: number;
    isActive: boolean;
    lastMessage: Chat['lastMessage'];
    user: any;
}) {
    // Get online status for private chats (optional - gracefully handle permission errors)
    const presenceQuery = useMemo(
        () => otherParticipantId ? doc(db, 'presence', otherParticipantId) : null,
        [otherParticipantId]
    );
    const { data: presence, error: presenceError } = useDoc<any>(presenceQuery);
    const isOnline = presence?.status === 'online' && !presenceError;

    return (
        <Link href={`/chats/${chat.id}`} className={cn(
            "block rounded-lg p-3 transition-colors relative",
            isActive ? "bg-secondary" : "hover:bg-secondary/50"
        )}>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Avatar>
                        <AvatarImage src={avatarUrl} alt={chatName} />
                        <AvatarFallback>{getInitials(chatName)}</AvatarFallback>
                    </Avatar>
                    {isOnline && !presenceError && (
                        <div className="absolute bottom-0 right-0">
                            <Circle className="h-3 w-3 fill-green-500 text-green-500 border-2 border-background rounded-full" />
                        </div>
                    )}
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex justify-between items-center gap-2">
                        <p className="font-semibold truncate text-sm">{chatName}</p>
                        {lastMessage?.timestamp && (
                            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                {formatDistanceToNow(lastMessage.timestamp.toDate(), { addSuffix: true })}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={cn(
                            "text-sm truncate",
                            unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}>
                            {lastMessage?.senderId === user?.id && 'You: '}{lastMessage?.content || 'No messages yet...'}
                        </p>
                        {unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs shrink-0">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

