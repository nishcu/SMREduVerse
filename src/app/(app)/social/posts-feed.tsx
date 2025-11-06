
'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type Post } from '@/lib/types';
import Link from 'next/link';
import { useCollection } from '@/firebase';
import { useMemo } from 'react';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { CommentDialog } from '@/components/comment-dialog';
import { toggleLikeAction, checkLikedAction, getLikedUsersAction, toggleFollowAction, checkFollowingAction } from './actions';

function PostSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="aspect-video w-full rounded-lg" />
      </CardContent>
      <CardFooter className="flex justify-between p-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}

function PostCard({ post }: { post: Post }) {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [likedUsers, setLikedUsers] = useState<Array<{ uid: string; name: string; avatarUrl: string }>>([]);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);

  const createdAt = post.createdAt?.toDate();
  const timeAgo = createdAt ? formatDistanceToNow(createdAt, { addSuffix: true }) : 'just now';

  const isOwnPost = user?.id === post.author.uid;

  // Check if user liked this post and if following
  useEffect(() => {
    if (firebaseUser && post.id) {
      const checkInitialState = async () => {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          // Check like status
          const likeResult = await checkLikedAction(post.id, idToken);
          if (likeResult.success) {
            setIsLiked(likeResult.liked);
          }
          
          // Check follow status
          const followResult = await checkFollowingAction(post.author.uid, idToken);
          if (followResult.success) {
            setIsFollowing(followResult.following);
          }
          
          // Load liked users
          const likedUsersResult = await getLikedUsersAction(post.id, 5);
          if (likedUsersResult.success) {
            setLikedUsers(likedUsersResult.users);
          }
        } catch (error) {
          console.error('Error checking initial state:', error);
        }
      };
      
      checkInitialState();
    }
  }, [firebaseUser, post.id, post.author.uid]);

  const handleLike = async () => {
    if (!firebaseUser || isLiking) return;
    
    setIsLiking(true);
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikes(wasLiked ? likes - 1 : likes + 1);
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await toggleLikeAction(post.id, idToken);
      
      if (result.success) {
        // Update like count from server
        setLikes(prev => result.liked ? prev + 1 : prev - 1);
        
        // Reload liked users
        const likedUsersResult = await getLikedUsersAction(post.id, 5);
        if (likedUsersResult.success) {
          setLikedUsers(likedUsersResult.users);
        }
      } else {
        // Revert optimistic update
        setIsLiked(wasLiked);
        setLikes(likes);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to like post.',
        });
      }
    } catch (error) {
      // Revert optimistic update
      setIsLiked(wasLiked);
      setLikes(likes);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to like post.',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleFollow = async () => {
    if (!firebaseUser || isFollowingAction || isOwnPost) return;
    
    setIsFollowingAction(true);
    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await toggleFollowAction(post.author.uid, idToken);
      
      if (result.success) {
        toast({
          title: result.following ? 'Followed!' : 'Unfollowed',
          description: result.following 
            ? `You are now following ${post.author.name}.`
            : `You unfollowed ${post.author.name}.`,
        });
      } else {
        // Revert optimistic update
        setIsFollowing(wasFollowing);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to follow user.',
        });
      }
    } catch (error) {
      // Revert optimistic update
      setIsFollowing(wasFollowing);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to follow user.',
      });
    } finally {
      setIsFollowingAction(false);
    }
  };

  const handleShare = () => {
    const shareText = `Check out this post by ${post.author.name} on EduVerse Architect!`;
    const shareUrl = `${window.location.origin}/posts/${post.id}`; // Assuming a post detail page exists
    if (navigator.share) {
      navigator.share({
        title: 'Post from EduVerse Architect',
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({
        title: 'Link Copied',
        description: 'Post link copied to your clipboard.',
      });
    }
  };

  const handleReport = () => {
    toast({
      variant: 'destructive',
      title: 'Post Reported',
      description: 'Thank you for your feedback. We will review this post.',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
        <Link href={`/profile/${post.author.uid}`}>
          <Avatar>
            <AvatarImage src={post.author.avatarUrl} />
            <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${post.author.uid}`} className="font-semibold hover:underline">
              {post.author.name}
            </Link>
            <span className="text-xs text-muted-foreground">· {timeAgo}</span>
            {!isOwnPost && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <button 
                  onClick={handleFollow} 
                  disabled={isFollowingAction}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{post.author.name.replace(/\s+/g, '').toLowerCase()}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleReport}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Report Post
            </DropdownMenuItem>
             {!isOwnPost && (
               <DropdownMenuItem onClick={handleFollow} disabled={isFollowingAction}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isFollowing ? 'Unfollow' : 'Follow'} {post.author.name}
              </DropdownMenuItem>
             )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
              src={post.imageUrl}
              alt="Post image"
              fill
              className="object-cover"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 border-t p-3">
        {/* Liked by users */}
        {likedUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
            <div className="flex -space-x-2">
              {likedUsers.slice(0, 3).map((user) => (
                <Avatar key={user.uid} className="h-5 w-5 border-2 border-background">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-[8px]">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span>
              {likes > 0 && (
                <>
                  Liked by {likedUsers[0]?.name}
                  {likes > 1 && ` and ${likes - 1} other${likes - 1 > 1 ? 's' : ''}`}
                </>
              )}
            </span>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-between w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-muted-foreground" 
            onClick={handleLike}
            disabled={isLiking || !firebaseUser}
          >
            <Heart className={`h-5 w-5 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likes}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-muted-foreground" 
            onClick={() => setIsCommentDialogOpen(true)}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{commentCount}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-muted-foreground" 
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
            <span>Share</span>
          </Button>
        </div>
      </CardFooter>
      <CommentDialog
        isOpen={isCommentDialogOpen}
        onOpenChange={(open) => {
          setIsCommentDialogOpen(open);
        }}
        postId={post.id}
        postAuthorId={post.author.uid}
        initialCommentCount={commentCount}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
      />
    </Card>
  );
}

interface PostsFeedProps {
  feedType?: 'for-you' | 'following' | 'trending';
}

export function PostsFeed({ feedType = 'for-you' }: PostsFeedProps) {
  const { firebaseUser } = useAuth();
  const [serverPosts, setServerPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // For "For You" feed, use client-side real-time collection
  const postsQuery = useMemo(() => query(collection(db, 'posts'), orderBy('createdAt', 'desc')), []);
  const { data: clientPosts, loading: clientLoading, error: clientError } = useCollection<Post>(postsQuery);

  useEffect(() => {
    const loadFeed = async () => {
      if (feedType === 'for-you') {
        // Use client-side real-time updates for "For You"
        setLoading(clientLoading);
        setError(clientError || null);
        return;
      }

      setLoading(true);
      try {
        if (feedType === 'following') {
          if (!firebaseUser) {
            setServerPosts([]);
            setLoading(false);
            return;
          }
          const idToken = await firebaseUser.getIdToken();
          const { getFollowingFeedAction } = await import('./actions');
          const result = await getFollowingFeedAction(idToken, 20);
          if (result.success) {
            // Convert ISO string timestamps back to Date objects for client-side use
            const formattedPosts = result.posts.map((post: any) => ({
              ...post,
              createdAt: post.createdAt ? (typeof post.createdAt === 'string' ? { toDate: () => new Date(post.createdAt) } : post.createdAt) : null,
            }));
            setServerPosts(formattedPosts as Post[]);
          } else {
            setError(new Error(result.error || 'Failed to load feed'));
          }
        } else if (feedType === 'trending') {
          const { getTrendingFeedAction } = await import('./actions');
          const result = await getTrendingFeedAction(20);
          if (result.success) {
            // Convert ISO string timestamps back to Date objects for client-side use
            const formattedPosts = result.posts.map((post: any) => ({
              ...post,
              createdAt: post.createdAt ? (typeof post.createdAt === 'string' ? { toDate: () => new Date(post.createdAt) } : post.createdAt) : null,
            }));
            setServerPosts(formattedPosts as Post[]);
          } else {
            setError(new Error(result.error || 'Failed to load feed'));
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [feedType, firebaseUser, clientLoading, clientError]);

  const posts = feedType === 'for-you' ? clientPosts : serverPosts;
  const isLoading = feedType === 'for-you' ? clientLoading : loading;
  const feedError = feedType === 'for-you' ? clientError : error;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="text-center text-destructive py-16">
        <p>Error loading posts: {feedError.message}</p>
      </div>
    );
  }

  if (posts?.length === 0) {
    if (feedType === 'following') {
      return (
        <div className="text-center text-muted-foreground py-16 space-y-4">
          <p className="text-lg font-semibold">You're not following anyone yet</p>
          <p>Start following users to see their posts here!</p>
        </div>
      );
    }
    return (
      <div className="text-center text-muted-foreground py-16">
        <p>No posts yet. Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
