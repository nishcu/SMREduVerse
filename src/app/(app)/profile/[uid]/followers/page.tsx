'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserPlus, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getFollowersAction } from './actions';
import { toggleFollowAction } from '@/app/(app)/social/actions';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';
import type { User } from '@/lib/types';
import { motion } from 'framer-motion';

function UserCard({ user, isFollowing, onFollowToggle, isLoading }: { 
  user: User; 
  isFollowing: boolean; 
  onFollowToggle: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Link href={`/profile/${user.id}`}>
              <Avatar className="h-12 w-12 cursor-pointer">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.id}`}>
                <h3 className="font-semibold hover:underline truncate">{user.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              {user.bio && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>
              )}
            </div>
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={onFollowToggle}
              disabled={isLoading}
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function FollowersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FollowersPage() {
  const params = useParams();
  const uid = params.uid as string;
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [followers, setFollowers] = useState<User[]>([]);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFollowers = async () => {
      if (!uid) return;
      
      setIsLoading(true);
      try {
        const idToken = firebaseUser ? await firebaseUser.getIdToken() : undefined;
        const result = await getFollowersAction(uid, idToken);
        
        if (result.success) {
          setFollowers(result.followers);
          setFollowingStatus(result.followingStatus || {});
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to load followers.',
          });
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load followers.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFollowers();
  }, [uid, firebaseUser, toast]);

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
            ? `You are now following ${followers.find(u => u.id === targetUserId)?.name || 'this user'}.`
            : `You unfollowed ${followers.find(u => u.id === targetUserId)?.name || 'this user'}.`,
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">Followers</h1>
          <p className="text-muted-foreground">People following this user</p>
        </div>
        <FollowersSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">Followers</h1>
        <p className="text-muted-foreground">
          {followers.length === 0 
            ? 'No followers yet.' 
            : `${followers.length} ${followers.length === 1 ? 'follower' : 'followers'}`}
        </p>
      </div>

      {followers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold">No Followers Yet</h3>
            <p>This user doesn't have any followers yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {followers.map((follower) => (
            <UserCard
              key={follower.id}
              user={follower}
              isFollowing={followingStatus[follower.id] || false}
              onFollowToggle={() => handleFollowToggle(follower.id)}
              isLoading={actionLoading[follower.id] || false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
