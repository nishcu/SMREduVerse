'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Users, Activity, Bell, TrendingUp, Coins, MessageSquare, ShoppingBag, Trophy } from 'lucide-react';
import type { ParentNotification, ActivityLog } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function ParentDashboardPage() {
  const { user, firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNotifications: 0,
    unreadNotifications: 0,
    totalChildren: 0,
    totalActivities: 0,
  });

  useEffect(() => {
    if (firebaseUser) {
      loadDashboardData();
    }
  }, [firebaseUser]);

  const loadDashboardData = async () => {
    if (!firebaseUser) return;
    
    setIsLoading(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      
      // Fetch notifications
      const notificationsRes = await fetch('/api/parent/notifications', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      const notificationsData = await notificationsRes.json();
      if (notificationsData.success) {
        setNotifications(notificationsData.notifications || []);
        setStats(prev => ({
          ...prev,
          totalNotifications: notificationsData.notifications?.length || 0,
          unreadNotifications: notificationsData.notifications?.filter((n: ParentNotification) => !n.read).length || 0,
        }));
      }

      // Fetch children
      const childrenRes = await fetch('/api/parent/children', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      const childrenData = await childrenRes.json();
      if (childrenData.success) {
        setChildren(childrenData.children || []);
        setStats(prev => ({
          ...prev,
          totalChildren: childrenData.children?.length || 0,
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'spending':
        return <Coins className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'purchase':
        return <ShoppingBag className="h-4 w-4" />;
      case 'challenge_join':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Parent Dashboard
        </h1>
        <p className="text-muted-foreground">
          Monitor your child's activities and receive notifications.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChildren}</div>
            <p className="text-xs text-muted-foreground">Connected accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unreadNotifications} unread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-muted-foreground">Tracked activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.length > 0 ? notifications[0].activities?.length || 0 : 0}
            </div>
            <p className="text-xs text-muted-foreground">In last report</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="children">Children</TabsTrigger>
          <TabsTrigger value="activities">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Notifications</CardTitle>
              <CardDescription>
                Periodic summaries of your child's activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications yet. Notifications will appear here when your child has activities.
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <Badge variant={notification.read ? 'secondary' : 'default'}>
                          {notification.read ? 'Read' : 'New'}
                        </Badge>
                      </div>
                      
                      {notification.activities && notification.activities.length > 0 && (
                        <div className="space-y-2 mt-3">
                          <p className="text-sm font-medium">Activities:</p>
                          <div className="space-y-1">
                            {notification.activities.map((activity, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getActivityIcon(activity.activityType)}
                                <span>{activity.activityTitle}</span>
                                {activity.metadata?.amount && (
                                  <span className="ml-auto font-semibold">
                                    {activity.metadata.amount} coins
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Period: {format(notification.periodStart.toDate?.() || new Date(notification.periodStart), 'MMM d, h:mm a')} - {format(notification.periodEnd.toDate?.() || new Date(notification.periodEnd), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="children" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Children</CardTitle>
              <CardDescription>
                Accounts linked to your parent account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No children accounts connected yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child.id} className="p-4 border rounded-lg">
                      <h3 className="font-semibold">{child.name}</h3>
                      <p className="text-sm text-muted-foreground">{child.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Activity Logs</CardTitle>
              <CardDescription>
                Complete activity history for all connected children.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Activity logs will be displayed here. This feature is coming soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

