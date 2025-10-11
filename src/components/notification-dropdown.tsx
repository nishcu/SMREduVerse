'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, UserPlus, Award, Heart, BookOpen, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockNotifications } from '@/lib/data';
import type { Notification } from '@/lib/types';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';

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
        default:
            return 'New notification';
    }
};

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const hasUnread = notifications.some((n) => !n.read);

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})))
  }

  const unreadNotifications = notifications.filter((n) => !n.read);
  
  return (
    <Popover>
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
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
                notifications.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} onRead={() => handleMarkAsRead(notif.id)} />
                ))
            ) : (
                <p className="text-center text-muted-foreground p-4">No notifications yet.</p>
            )}
          </TabsContent>
          <TabsContent value="unread" className="max-h-96 overflow-y-auto">
             {unreadNotifications.length > 0 ? (
                unreadNotifications.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} onRead={() => handleMarkAsRead(notif.id)} />
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
    return (
         <div className={cn("flex items-start gap-3 p-3 hover:bg-secondary/50", !notification.read && "bg-secondary")}>
            <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
            <div className="flex-grow">
                <div className="text-sm">{getNotificationText(notification)}</div>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(notification.timestamp, { addSuffix: true })}
                </p>
            </div>
            {!notification.read && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRead}>
                    <CheckCircle className="h-4 w-4" title="Mark as read" />
                </Button>
            )}
        </div>
    )
}
