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
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DiscoverPage() {
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

    loadUsers();
  }, [firebaseUser, toast]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.bio?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Filter by tab
  const displayUsers = activeTab === 'following' 
    ? filteredUsers.filter(u => followingStatus[u.id])
    : activeTab === 'not-following'
    ? filteredUsers.filter(u => !followingStatus[u.id])
    : filteredUsers;

  const handleFollowToggle = async (targetUserId: string) => {
    if (!firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Not Signed In',
        description: 'Please sign in to follow users.',
      });
      return;
    }

    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    const wasFollowing = followingStatus[targetUserId] || false;

    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await toggleFollowAction(targetUserId, idToken);

      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: result.following }));
        toast({
          title: result.following ? 'Followed!' : 'Unfollowed',
          description: result.following 
            ? `You are now following ${users.find(u => u.id === targetUserId)?.name || 'this user'}.`
            : `You unfollowed ${users.find(u => u.id === targetUserId)?.name || 'this user'}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to follow user.',
        });
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: wasFollowing }));
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to follow user.',
      });
      setFollowingStatus(prev => ({ ...prev, [targetUserId]: wasFollowing }));
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    if (!user || !firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Not Signed In',
        description: 'Please sign in to start a chat.',
      });
      return;
    }

    setChatLoading(prev => ({ ...prev, [targetUserId]: true }));
    try {
      const result = await getOrCreateChatAction(user.id, targetUserId);
      if (result.success && result.chatId) {
        router.push(`/chats/${result.chatId}`);
        toast({
          title: 'Chat Started',
          description: `You can now chat with ${users.find(u => u.id === targetUserId)?.name || 'this user'}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Could not start chat.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start chat.',
      });
    } finally {
      setChatLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">Discover Users</h1>
          <p className="text-muted-foreground">Find and connect with other learners</p>
        </div>
        <DiscoverSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Discover Users
        </h1>
        <p className="text-muted-foreground">Find and connect with other learners, tutors, and study buddies</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
          <CardDescription>Search by name, username, email, or bio</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

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
    </div>
  );
}

