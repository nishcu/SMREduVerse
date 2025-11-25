
'use client';

import { collection, query, orderBy, limit, startAfter, getDocs, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore';
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
  MessageSquare,
  Loader2,
  Volume2,
  VolumeX,
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
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback, useRef } from 'react';
import { CommentDialog } from '@/components/comment-dialog';
import { toggleLikeAction, checkLikedAction, getLikedUsersAction, toggleFollowAction, checkFollowingAction } from './actions';
import { getOrCreateChatAction } from '@/app/(app)/chats/actions';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoInView, setIsVideoInView] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const heartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    return () => {
      if (heartTimeoutRef.current) {
        clearTimeout(heartTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (post.postType !== 'video' || !videoRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.55;
        setIsVideoInView(isVisible);
        if (isVisible) {
          videoElement
            .play()
            .then(() => setIsVideoReady(true))
            .catch(() => {
              // Autoplay restrictions may block play until user interacts
              setIsVideoReady(false);
            });
        } else {
          videoElement.pause();
        }
      },
      {
        threshold: [0.25, 0.55, 0.9],
      }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
      videoElement.pause();
    };
  }, [post.postType]);

  const triggerHeartBurst = useCallback(() => {
    if (heartTimeoutRef.current) {
      clearTimeout(heartTimeoutRef.current);
    }
    setShowHeartBurst(true);
    heartTimeoutRef.current = setTimeout(() => {
      setShowHeartBurst(false);
    }, 600);
  }, []);

  const handleLike = async () => {
    if (!firebaseUser || isLiking) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    const previousLikes = likes;
    setIsLiked(!wasLiked);
    setLikes(wasLiked ? Math.max(previousLikes - 1, 0) : previousLikes + 1);
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await toggleLikeAction(post.id, idToken);
      
      if (result.success) {
        const likedUsersResult = await getLikedUsersAction(post.id, 5);
        if (likedUsersResult.success) {
          setLikedUsers(likedUsersResult.users);
        }
      } else {
        setIsLiked(wasLiked);
        setLikes(previousLikes);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to like post.',
        });
      }
    } catch (error) {
      setIsLiked(wasLiked);
      setLikes(previousLikes);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to like post.',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleMediaDoubleTap = () => {
    triggerHeartBurst();
    if (!isLiked) {
      handleLike();
    }
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 250) {
      handleMediaDoubleTap();
    }
    lastTapRef.current = now;
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

  const handleStartChat = async () => {
    if (!user || !firebaseUser || isStartingChat || isOwnPost) return;
    
    if (!user.id || !post.author.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid user information. Please try again.',
      });
      return;
    }

    // Prevent starting chat with yourself
    if (user.id === post.author.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You cannot start a chat with yourself.',
      });
      return;
    }
    
    setIsStartingChat(true);
    
    try {
      const result = await getOrCreateChatAction(user.id, post.author.uid);
      if (result.success && result.chatId) {
        // Use window.location.href to avoid hydration issues
        window.location.href = `/chats/${result.chatId}`;
      } else {
        setIsStartingChat(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Could not start chat.',
        });
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      setIsStartingChat(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start chat. Please try again.',
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
          <div
            className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black"
            onDoubleClick={handleMediaDoubleTap}
            onTouchEnd={handleTouchEnd}
          >
            {post.postType === 'video' ? (
              <>
                <video
                  ref={videoRef}
                  src={post.imageUrl}
                  className="h-full w-full object-cover"
                  muted={isVideoMuted}
                  loop
                  playsInline
                  controls={false}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!videoRef.current) return;
                    if (videoRef.current.paused) {
                      videoRef.current.play();
                    } else {
                      videoRef.current.pause();
                    }
                  }}
                  onLoadedData={() => setIsVideoReady(true)}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <AnimatePresence>
                    {showHeartBurst && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      >
                        <Heart className="h-20 w-20 text-white drop-shadow-lg fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setIsVideoMuted((prev) => {
                        const next = !prev;
                        if (videoRef.current) {
                          videoRef.current.muted = next;
                        }
                        return next;
                      });
                    }}
                    className="flex items-center gap-1"
                  >
                    {isVideoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    <span>{isVideoMuted ? 'Muted' : 'Sound on'}</span>
                  </button>
                  <span className="hidden sm:inline">
                    {isVideoInView && isVideoReady ? 'Playing' : 'Paused'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Image
                  src={post.imageUrl}
                  alt="Post image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <AnimatePresence>
                    {showHeartBurst && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      >
                        <Heart className="h-20 w-20 text-white drop-shadow-lg fill-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
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
          {!isOwnPost && firebaseUser && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 text-muted-foreground" 
              onClick={handleStartChat}
              disabled={isStartingChat}
            >
              <MessageSquare className="h-5 w-5" />
              <span>{isStartingChat ? 'Starting...' : 'Message'}</span>
            </Button>
          )}
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

const BATCH_SIZE = 8;

const mapDocToPost = (doc: QueryDocumentSnapshot<DocumentData>): Post => ({
  id: doc.id,
  ...(doc.data() as Omit<Post, 'id'>),
});

interface PostsFeedProps {
  feedType?: 'for-you' | 'following' | 'trending';
}

export function PostsFeed({ feedType = 'for-you' }: PostsFeedProps) {
  const { firebaseUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadInitialForYou = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const initialQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(BATCH_SIZE)
      );
      const snapshot = await getDocs(initialQuery);
      const newPosts = snapshot.docs.map(mapDocToPost);
      setPosts(newPosts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === BATCH_SIZE);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadServerFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasMore(false);
    try {
      if (feedType === 'following') {
        if (!firebaseUser) {
          setPosts([]);
          setLoading(false);
          return;
        }
        const idToken = await firebaseUser.getIdToken();
        const { getFollowingFeedAction } = await import('./actions');
        const result = await getFollowingFeedAction(idToken, 20);
        if (result.success) {
          const formattedPosts = result.posts.map((post: any) => ({
            ...post,
            createdAt: post.createdAt
              ? typeof post.createdAt === 'string'
                ? { toDate: () => new Date(post.createdAt) }
                : post.createdAt
              : null,
          }));
          setPosts(formattedPosts as Post[]);
        } else {
          setError(new Error(result.error || 'Failed to load feed'));
        }
      } else if (feedType === 'trending') {
        const { getTrendingFeedAction } = await import('./actions');
        const result = await getTrendingFeedAction(20);
        if (result.success) {
          const formattedPosts = result.posts.map((post: any) => ({
            ...post,
            createdAt: post.createdAt
              ? typeof post.createdAt === 'string'
                ? { toDate: () => new Date(post.createdAt) }
                : post.createdAt
              : null,
          }));
          setPosts(formattedPosts as Post[]);
        } else {
          setError(new Error(result.error || 'Failed to load feed'));
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [feedType, firebaseUser]);

  const fetchMoreForYou = useCallback(async () => {
    if (feedType !== 'for-you' || !hasMore || isFetchingMore || !lastDoc) {
      return;
    }
    setIsFetchingMore(true);
    try {
      const nextQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(BATCH_SIZE)
      );
      const snapshot = await getDocs(nextQuery);
      const newPosts = snapshot.docs.map(mapDocToPost);
      setPosts((prev) => [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === BATCH_SIZE);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [feedType, hasMore, isFetchingMore, lastDoc]);

  useEffect(() => {
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    setIsFetchingMore(false);
    setError(null);

    if (feedType === 'for-you') {
      loadInitialForYou();
    } else {
      loadServerFeed();
    }
  }, [feedType, loadInitialForYou, loadServerFeed]);

  useEffect(() => {
    if (feedType !== 'for-you') return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fetchMoreForYou();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [feedType, fetchMoreForYou]);

  const feedError = error;

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
      {feedType === 'for-you' && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center pb-6 pt-2 text-sm text-muted-foreground"
        >
          {hasMore ? (
            isFetchingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more posts...
              </span>
            ) : (
              'Keep scrolling for more posts'
            )
          ) : (
            "You're all caught up 🎉"
          )}
        </div>
      )}
    </div>
  );
}
