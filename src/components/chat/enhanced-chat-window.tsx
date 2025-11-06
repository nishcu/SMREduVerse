'use client';

import { useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, type Query, updateDoc, doc, arrayUnion, onSnapshot, writeBatch, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, ChatMessage } from '@/lib/types';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { cn, getInitials } from '@/lib/utils';
import { moderateMessage } from '@/app/(app)/study-rooms/[id]/actions';
// Chat actions will be handled client-side with Firestore
import { useToast } from '@/hooks/use-toast';

interface ChatWindowProps {
  chatId: string;
  chat: Chat;
}

function MessageTime({ timestamp }: { timestamp?: any }) {
  const [time, setTime] = useState<string>('Sending...');
  
  useEffect(() => {
    if (timestamp) {
      try {
        setTime(format(timestamp.toDate(), 'HH:mm'));
      } catch (error) {
        setTime('Sending...');
      }
    }
  }, [timestamp]);
  
  return <p className="text-xs opacity-70" suppressHydrationWarning>{time}</p>;
}

function MessageBubble({
  message,
  isOwn,
  authorDetails,
  otherParticipantId,
}: {
  message: ChatMessage;
  isOwn: boolean;
  authorDetails?: { name: string; avatarUrl: string; uid: string; };
  otherParticipantId?: string;
}) {
  const isRead = otherParticipantId ? (message.readBy?.includes(otherParticipantId) || false) : false;
  const isSent = message.readBy?.includes(message.authorUid) || false;

  return (
    <div className={cn('flex items-end gap-2 group', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={authorDetails?.avatarUrl} />
          <AvatarFallback>{getInitials(authorDetails?.name || '?')}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2 shadow-sm',
          isOwn 
            ? 'bg-primary text-primary-foreground rounded-br-sm' 
            : 'bg-secondary rounded-bl-sm'
        )}
      >
        {message.type === 'text' ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : message.type === 'image' ? (
          <img src={message.content} alt="Chat content" className="max-w-full rounded-lg" />
        ) : (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            View file
          </a>
        )}
        <div className="flex items-center justify-end gap-1 mt-1">
          <MessageTime timestamp={message.timestamp} />
          {isOwn && (
            <div className="ml-1">
              {isRead ? (
                <CheckCheck className="h-3 w-3 opacity-70" />
              ) : isSent ? (
                <Check className="h-3 w-3 opacity-70" />
              ) : (
                <Check className="h-3 w-3 opacity-30" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnhancedChatWindow({ chatId, chat }: ChatWindowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const otherParticipantId = chat.participants.find(p => p !== user?.id);

  const messagesQuery = useMemo(
    () => query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc')) as Query<ChatMessage>,
    [chatId]
  );
  const { data: messages, loading, error } = useCollection<ChatMessage>(messagesQuery);

  // Listen for typing indicators
  useEffect(() => {
    if (!chatId || !user?.id) return;

    let unsubscribe: (() => void) | null = null;

    try {
      const typingRef = collection(db, 'chats', chatId, 'typing');
      unsubscribe = onSnapshot(
        typingRef,
        (snapshot) => {
          const typing: string[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.userId !== user?.id && data.isTyping) {
              // Check if typing indicator is recent (within last 3 seconds)
              const typingTime = data.timestamp?.toDate?.()?.getTime() || 0;
              const now = Date.now();
              if (now - typingTime < 3000) {
                typing.push(data.userId);
              }
            }
          });
          setTypingUsers(typing);
        },
        (err) => {
          // Silently handle errors for typing indicators
          if (err.code !== 'permission-denied') {
            // Only log non-permission errors
          }
        }
      );
    } catch (err) {
      // Silently handle setup errors
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [chatId, user?.id]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (chatId && user?.id && messages && messages.length > 0) {
      const markAsRead = async () => {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, {
            [`unreadCount.${user.id}`]: 0,
          });

          // Mark all unread messages from other users as read
          const batch = writeBatch(db);
          let hasUpdates = false;

          messages.forEach((msg) => {
            if (msg.authorUid !== user.id && (!msg.readBy || !msg.readBy.includes(user.id))) {
              const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
              batch.update(msgRef, {
                readBy: arrayUnion(user.id),
              });
              hasUpdates = true;
            }
          });

          if (hasUpdates) {
            await batch.commit();
          }
        } catch (error) {
          // Error marking messages as read - silently fail
        }
      };
      markAsRead();
    }
  }, [chatId, user?.id, messages?.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  // Handle typing indicator
  const handleTyping = async (value: string) => {
    setNewMessage(value);
    
    if (!isTyping && value.trim().length > 0 && user) {
      setIsTyping(true);
      const typingRef = doc(db, 'chats', chatId, 'typing', user.id);
      await updateDoc(typingRef, {
        userId: user.id,
        isTyping: true,
        timestamp: serverTimestamp(),
      }).catch(() => {
        // Create if doesn't exist
        setDoc(typingRef, {
          userId: user.id,
          isTyping: true,
          timestamp: serverTimestamp(),
        });
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of no typing
    typingTimeoutRef.current = setTimeout(async () => {
      if (user) {
        setIsTyping(false);
        const typingRef = doc(db, 'chats', chatId, 'typing', user.id);
        await updateDoc(typingRef, {
          isTyping: false,
        }).catch(() => {
          // Document might not exist, that's okay
        });
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (user) {
      const typingRef = doc(db, 'chats', chatId, 'typing', user.id);
      await updateDoc(typingRef, {
        isTyping: false,
      }).catch(() => {
        // Document might not exist, that's okay
      });
    }

    // Moderate message before sending
    const moderationResult = await moderateMessage(newMessage);
    if (moderationResult.flagForReview) {
      toast({
        variant: 'destructive',
        title: 'Message Flagged',
        description: 'Your message contains inappropriate content.',
      });
      return;
    }

    try {
      const messageData = {
        authorUid: user.id,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        type: 'text' as const,
        readBy: [user.id], // Sender has read their own message
      };
      
      const messagesCollection = collection(db, 'chats', chatId, 'messages');
      const messageRef = await addDoc(messagesCollection, messageData);
      
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content: newMessage.trim(),
          timestamp: serverTimestamp(),
          senderId: user.id
        }
      });

      // Create notification for recipient (handled server-side via Firestore trigger or client-side)
      // For now, we'll let the server action handle it when message is sent
      // This would typically be done via a Cloud Function, but we can do it client-side too
      if (otherParticipantId) {
        try {
          // Import server action dynamically
          const { createChatNotificationAction } = await import('@/app/(app)/chats/actions');
          await createChatNotificationAction(chatId, user.id, newMessage.trim(), otherParticipantId);
        } catch (error) {
          // Error creating notification - silently fail
        }
      }

      setNewMessage('');
    } catch (err) {
      // Error sending message - show toast instead
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target?.result as string;
      
      const messageData = {
        authorUid: user.id,
        content: fileContent,
        timestamp: serverTimestamp(),
        type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
        readBy: [user.id],
      };
      const messagesCollection = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesCollection, messageData);

      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content: `Sent a${file.type.startsWith('image/') ? 'n image' : ' file'}.`,
          timestamp: serverTimestamp(),
          senderId: user.id
        }
      });

      if (otherParticipantId) {
        await createChatNotificationAction(chatId, user.id, `Sent a${file.type.startsWith('image/') ? 'n image' : ' file'}.`, otherParticipantId);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex-grow p-4 space-y-4">
        <Skeleton className="h-12 w-3/5" />
        <Skeleton className="h-12 w-3/5 ml-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Unable to load messages. Please check your permissions or try again later.
      </div>
    );
  }

  const typingUserName = typingUsers.length > 0 
    ? chat.participantDetails[typingUsers[0]]?.name || 'Someone'
    : null;

  return (
    <div className="flex flex-col h-full bg-muted/20">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.authorUid === user?.id}
                authorDetails={chat.participantDetails[msg.authorUid]}
                otherParticipantId={otherParticipantId}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <p className="text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          )}
          {typingUserName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{typingUserName} is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              autoComplete="off"
              disabled={!user}
              className="pr-10"
            />
          </div>
          <Button type="submit" size="icon" disabled={!newMessage.trim() || !user} className="shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

