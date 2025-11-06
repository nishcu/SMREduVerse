'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, UserPlus, Award, Heart, BookOpen, CheckCircle, MessageCircle, Target, TrendingUp, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Notification } from '@/lib/types';
import { formatDistanceToNowStrict, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction } from '@/app/(app)/social/actions';
import { Skeleton } from './ui/skeleton';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'new_follower':
      return <UserPlus className="h-6 w-6 text-blue-500" />;
    case 'course_enrollment':
      return <BookOpen className="h-6 w-6 text-purple-500" />;
    case 'contest_win':
      return <Award className="h-6 w-6 text-amber-500" />;
    case 'post_like':
      return <Heart className="h-6 w-6 text-red-500" />;
    case 'post_comment':
      return <MessageCircle className="h-6 w-6 text-green-500" />;
    case 'challenge_invite':
      return <Target className="h-6 w-6 text-orange-500" />;
    case 'challenge_progress':
      return <TrendingUp className="h-6 w-6 text-indigo-500" />;
    case 'chat_message':
      return <MessageSquare className="h-6 w-6 text-blue-500" />;
    default:
      return <Bell className="h-6 w-6 text-gray-500" />;
  }
};

const getNotificationText = (notification: Notification) => {
    const actor = <Link href={`/profile/${notification.actor.uid}`} className="font-bold hover:underline">{notification.actor.name}</Link>;
    switch (notification.type) {
        case 'new_follower':
            return <>{actor} started following you.</>;
        case 'course_enrollment':
            return <>You have been enrolled in {actor}'s course: <span className="font-bold">{notification.data?.courseName}</span>.</>;
        case 'contest_win':
            return <>Congratulations! You won the <span className="font-bold">{notification.data?.contestName}</span>.</>;
        case 'post_like':
            return <>{actor} liked your post.</>;
        case 'post_comment':
            return <>{actor} commented on your post.</>;
        case 'challenge_invite':
            return <>{actor} joined your challenge!</>;
        case 'challenge_progress':
            return <>{actor} is making progress in a challenge you're both in.</>;
        case 'chat_message':
            return <>{actor} sent you a message: <span className="font-medium">{notification.data?.messagePreview?.slice(0, 50)}...</span></>;
        default:
            return 'New notification';
    }
};

export function NotificationDropdown() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  
  const hasUnread = notifications.some((n) => !n.read);

  useEffect(() => {
    if (isOpen && firebaseUser) {
      loadNotifications();
      
      // Auto-refresh every 10 seconds when dropdown is open
      const interval = setInterval(() => {
        loadNotifications();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, firebaseUser]);

  const loadNotifications = async () => {
    if (!firebaseUser) return;
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await getNotificationsAction(idToken, 50);
      
      if (result.success) {
        // Convert Firestore timestamps to Date objects
        const formattedNotifications = result.notifications.map((notif: any) => ({
          ...notif,
          timestamp: notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date(notif.createdAt || Date.now()),
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!firebaseUser) return;
    
    // Optimistic update
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    
    try {
      const idToken = await firebaseUser.getIdToken();
      await markNotificationReadAction(id, idToken);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      loadNotifications();
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!firebaseUser || !hasUnread) return;
    
    // Optimistic update
    setNotifications(notifications.map(n => ({...n, read: true})));
    
    try {
      const idToken = await firebaseUser.getIdToken();
      await markAllNotificationsReadAction(idToken);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert on error
      loadNotifications();
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  
  if (!firebaseUser) {
    return null;
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute right-1 top-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96" align="end">
        <div className="flex items-center justify-between p-2">
            <h3 className="font-medium">Notifications</h3>
            <Button variant="link" size="sm" onClick={handleMarkAllAsRead} disabled={!hasUnread}>Mark all as read</Button>
        </div>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <NotificationItem 
                  key={notif.id} 
                  notification={notif} 
                  onRead={() => handleMarkAsRead(notif.id)} 
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">No notifications yet.</p>
            )}
          </TabsContent>
          <TabsContent value="unread" className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : unreadNotifications.length > 0 ? (
              unreadNotifications.map((notif) => (
                <NotificationItem 
                  key={notif.id} 
                  notification={notif} 
                  onRead={() => handleMarkAsRead(notif.id)} 
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">No unread notifications.</p>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({ notification, onRead }: { notification: Notification, onRead: () => void }) {
    const timestamp = notification.timestamp instanceof Date 
      ? notification.timestamp 
      : notification.timestamp?.toDate 
        ? notification.timestamp.toDate() 
        : new Date();
    
           const notificationLink = notification.data?.chatId
             ? `/chats/${notification.data.chatId}`
             : notification.data?.postId 
             ? `/social#post-${notification.data.postId}`
             : notification.data?.challengeId
             ? `/challenges/${notification.data.challengeId}`
             : `/profile/${notification.actor.uid}`;
    
    return (
        <Link href={notificationLink} className={cn("flex items-start gap-3 p-3 hover:bg-secondary/50 cursor-pointer", !notification.read && "bg-secondary/50")}>
            <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={notification.actor.avatarUrl} />
                <AvatarFallback>{notification.actor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
                <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-grow min-w-0">
                        <div className="text-sm break-words">{getNotificationText(notification)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(timestamp, { addSuffix: true })}
                        </p>
                    </div>
                </div>
            </div>
            {!notification.read && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 flex-shrink-0" 
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRead();
                    }}
                >
                    <CheckCircle className="h-4 w-4" title="Mark as read" />
                </Button>
            )}
        </Link>
    )
}
