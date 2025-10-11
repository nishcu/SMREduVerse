
'use client';

import { useCollection } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, type Query, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, ChatMessage } from '@/lib/types';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Camera, Paperclip } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { cn, getInitials } from '@/lib/utils';
import { moderateMessage } from '@/app/(app)/study-rooms/[id]/actions';

interface ChatWindowProps {
  chatId: string;
  chat: Chat;
}

function MessageBubble({
  message,
  isOwn,
  authorDetails,
}: {
  message: ChatMessage;
  isOwn: boolean;
  authorDetails?: { name: string; avatarUrl: string; uid: string; };
}) {
  return (
    <div className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={authorDetails?.avatarUrl} />
          <AvatarFallback>{getInitials(authorDetails?.name || '?')}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2',
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {message.type === 'text' ? (
          <p className="text-sm">{message.content}</p>
        ) : message.type === 'image' ? (
          <img src={message.content} alt="Chat content" className="max-w-full rounded" />
        ) : (
          <a href={message.content} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            View file
          </a>
        )}
        <p className="text-xs text-right mt-1 opacity-70">
          {message.timestamp ? format(message.timestamp.toDate(), 'p') : 'Sending...'}
        </p>
      </div>
    </div>
  );
}

export function ChatWindow({ chatId, chat }: ChatWindowProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesQuery = useMemo(
    () => query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc')) as Query<ChatMessage>,
    [chatId]
  );
  const { data: messages, loading, error } = useCollection<ChatMessage>(messagesQuery);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        // A slight delay to allow the new message to render
        setTimeout(() => {
             const viewport = scrollAreaRef.current?.querySelector('div');
             if(viewport) viewport.scrollTop = viewport.scrollHeight;
        }, 100);
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Moderate message before sending
    const moderationResult = await moderateMessage(newMessage);
    if(moderationResult.flagForReview) {
        console.warn('Message flagged:', moderationResult.reason);
        // Optionally, show a toast to the user
    }

    try {
      const messageData = {
        authorUid: user.id,
        content: newMessage,
        timestamp: serverTimestamp(),
        type: 'text' as const,
        readBy: [user.id],
      };
      
      const messagesCollection = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesCollection, messageData);
      
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content: newMessage,
          timestamp: serverTimestamp(),
          senderId: user.id
        }
      });

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    // In a real app, upload file to Firebase Storage and get URL.
    // For now, we'll simulate this with a data URL (not scalable for large files).
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
    };
    reader.readAsDataURL(file);
  }

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

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.authorUid === user?.id}
                authorDetails={chat.participantDetails[msg.authorUid]}
              />
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8">
              No messages yet. Start the conversation!
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
           <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                <Paperclip />
                <span className="sr-only">Attach file</span>
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            disabled={!user}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || !user}>
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}
