'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, UserCheck, MessageSquare, Search, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import type { User } from '@/lib/types';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toggleFollowAction, checkFollowingAction } from '@/app/(app)/social/actions';
import { getOrCreateChatAction } from '@/app/(app)/chats/actions';
import { useRouter } from 'next/navigation';

function UserCard({ user, isFollowing, onFollowToggle, onMessage, isLoading, isStartingChat }: { 
  user: User; 
  isFollowing: boolean; 
  onFollowToggle: () => void;
  onMessage: () => void;
  isLoading: boolean;
  isStartingChat: boolean;
}) {
  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Link href={`/profile/${user.id}`}>
              <Avatar className="h-16 w-16 cursor-pointer border-2 border-primary">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.id}`}>
                <h3 className="font-semibold text-lg hover:underline truncate">{user.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{user.followersCount || 0} followers</span>
                <span>·</span>
                <span>{user.followingCount || 0} following</span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={onFollowToggle}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Users className="h-4 w-4 animate-pulse" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMessage}
                  disabled={isStartingChat}
                  className="flex-1"
                >
                  {isStartingChat ? (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4 animate-pulse" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DiscoverPageContent() {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [chatLoading, setChatLoading] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      if (!firebaseUser) return;
      
      setIsLoading(true);
      try {
        const idToken = await firebaseUser.getIdToken();
        
        // Fetch all users (excluding current user)
        const response = await fetch(`/api/users/discover?idToken=${idToken}`);
        const data = await response.json();
        
        if (data.success) {
          setUsers(data.users);
          setFilteredUsers(data.users);
          setFollowingStatus(data.followingStatus || {});
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: data.error || 'Failed to load users.',
          });
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load users.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted && firebaseUser) {
      loadUsers();
    }
  }, [firebaseUser, toast, mounted]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleFollowToggle = async (userId: string) => {
    if (!firebaseUser || !user) return;

    setActionLoading((prev) => ({ ...prev, [userId]: true }));

    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await toggleFollowAction(idToken, userId);

      if (result.success) {
        setFollowingStatus((prev) => ({
          ...prev,
          [userId]: result.following || false,
        }));

        // Update user counts
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === userId) {
              return {
                ...u,
                followersCount: (u.followersCount || 0) + (result.following ? 1 : -1),
              };
            }
            if (u.id === user.id) {
              return {
                ...u,
                followingCount: (u.followingCount || 0) + (result.following ? 1 : -1),
              };
            }
            return u;
          })
        );

        toast({
          title: result.following ? 'Following' : 'Unfollowed',
          description: result.following
            ? `You are now following ${users.find((u) => u.id === userId)?.name || 'this user'}`
            : `You unfollowed ${users.find((u) => u.id === userId)?.name || 'this user'}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to update follow status.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update follow status.',
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleStartChat = async (userId: string) => {
    if (!firebaseUser || !user || user.id === userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot start a chat with yourself.',
      });
      return;
    }

    setChatLoading((prev) => ({ ...prev, [userId]: true }));

    try {
      const result = await getOrCreateChatAction(user.id, userId);

      if (result.success && result.chatId) {
        // Use window.location.href to force full page reload and avoid hydration errors
        window.location.href = `/chats/${result.chatId}`;
      } else {
        setChatLoading((prev) => ({ ...prev, [userId]: false }));
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to start chat.',
        });
      }
    } catch (error: any) {
      setChatLoading((prev) => ({ ...prev, [userId]: false }));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start chat.',
      });
    }
  };

  if (!mounted) {
    return <div className="h-full bg-background" />;
  }

  const displayUsers =
    activeTab === 'all'
      ? filteredUsers
      : activeTab === 'following'
      ? filteredUsers.filter((u) => followingStatus[u.id])
      : filteredUsers.filter((u) => !followingStatus[u.id]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Discover Users</CardTitle>
              <CardDescription>
                Find and connect with other learners, tutors, and students
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, username, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <DiscoverSkeleton />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Users ({displayUsers.length})</TabsTrigger>
            <TabsTrigger value="not-following">Not Following ({filteredUsers.filter(u => !followingStatus[u.id]).length})</TabsTrigger>
            <TabsTrigger value="following">Following ({filteredUsers.filter(u => followingStatus[u.id]).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {displayUsers.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 mb-4" />
                  <h3 className="text-xl font-semibold">
                    {searchQuery ? 'No users found' : 'No users available'}
                  </h3>
                  <p>
                    {searchQuery 
                      ? 'Try a different search term' 
                      : 'Check back later for more users to discover'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {displayUsers.map((discoveredUser) => (
                  <UserCard
                    key={discoveredUser.id}
                    user={discoveredUser}
                    isFollowing={followingStatus[discoveredUser.id] || false}
                    onFollowToggle={() => handleFollowToggle(discoveredUser.id)}
                    onMessage={() => handleStartChat(discoveredUser.id)}
                    isLoading={actionLoading[discoveredUser.id] || false}
                    isStartingChat={chatLoading[discoveredUser.id] || false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

