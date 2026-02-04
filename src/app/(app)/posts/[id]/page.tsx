'use client';

import { doc, DocumentReference } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { useDoc } from '@/firebase';
import { db } from '@/lib/firebase';
import { use, useMemo, useState, useEffect } from 'react';
import type { Post } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CommentDialog } from '@/components/comment-dialog';
import { toggleLikeAction, checkLikedAction, getLikedUsersAction, toggleFollowAction, checkFollowingAction } from '@/app/(app)/social/actions';
import { getOrCreateChatAction } from '@/app/(app)/chats/actions';

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const postRef = useMemo(() => doc(db, 'posts', id) as DocumentReference<Post>, [id]);
  const { data: post, loading, error } = useDoc<Post>(postRef);
  
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowingAction, setIsFollowingAction] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [timeAgo, setTimeAgo] = useState('just now');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (post) {
      setLikes(post.likes || 0);
      setCommentCount(post.comments || 0);
      
      if (post.createdAt) {
        try {
          const createdAt = post.createdAt.toDate();
          setTimeAgo(formatDistanceToNow(createdAt, { addSuffix: true }));
        } catch (err) {
          setTimeAgo('just now');
        }
      }
    }
  }, [post]);

  useEffect(() => {
    if (firebaseUser && post?.id) {
      const checkInitialState = async () => {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          const likeResult = await checkLikedAction(post.id, idToken);
          if (likeResult.success) {
            setIsLiked(likeResult.liked);
          }
          
          const followResult = await checkFollowingAction(post.author.uid, idToken);
          if (followResult.success) {
            setIsFollowing(followResult.following);
          }
        } catch (error) {
          // Silently fail
        }
      };
      checkInitialState();
    }
  }, [firebaseUser, post?.id, post?.author.uid]);

  if (!mounted) {
    return <div className="h-full bg-background" />;
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Skeleton className="h-10 w-32 mb-4" />
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
        </Card>
      </div>
    );
  }

  if (error || !post) {
    notFound();
  }

  const isOwnPost = user?.id === post.author.uid;

  const handleLike = async () => {
    if (!firebaseUser || isLiking) return;
    
    setIsLiking(true);
    const wasLiked = isLiked;
    const previousLikes = likes;
    
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikes(wasLiked ? previousLikes - 1 : previousLikes + 1);
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await toggleLikeAction(post.id, idToken);
      
      if (!result.success) {
        // Revert optimistic update
        setIsLiked(wasLiked);
        setLikes(previousLikes);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to like post.',
        });
      }
    } catch (error: any) {
      // Revert optimistic update
      setIsLiked(wasLiked);
      setLikes(previousLikes);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to like post.',
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleFollow = async () => {
    if (!firebaseUser || isFollowingAction || isOwnPost) return;
    
    setIsFollowingAction(true);
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
        setIsFollowing(wasFollowing);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to follow user.',
        });
      }
    } catch (error) {
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

  const handleStartChat = async () => {
    if (!firebaseUser || !user || isOwnPost) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cannot start a chat with yourself.',
      });
      return;
    }

    setIsStartingChat(true);

    try {
      const result = await getOrCreateChatAction(user.id, post.author.uid);

      if (result.success && result.chatId) {
        setTimeout(() => {
          router.push(`/chats/${result.chatId}`);
        }, 100);
      } else {
        setIsStartingChat(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to start chat.',
        });
      }
    } catch (error: any) {
      setIsStartingChat(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start chat. Please try again.',
      });
    }
  };

  const handleShare = () => {
    const shareText = `Check out this post by ${post.author.name} on GenZeerr!`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Post from GenZeerr',
        text: shareText,
        url: shareUrl,
      }).catch(() => {
        // Silently fail
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({
        title: 'Link Copied',
        description: 'Post link copied to your clipboard.',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
          <Link href={`/profile/${post.author.uid}`}>
            <Avatar className="h-10 w-10 cursor-pointer">
              <AvatarImage src={post.author.avatarUrl} alt={post.author.name} />
              <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${post.author.uid}`}>
                <span className="font-semibold hover:underline cursor-pointer">
                  {post.author.name}
                </span>
              </Link>
              {!isOwnPost && firebaseUser && (
                <Button
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  onClick={handleFollow}
                  disabled={isFollowingAction}
                  className="h-7 px-3 text-xs"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 pb-4">
          <div className="whitespace-pre-wrap break-words">{post.content}</div>
          
          {post.imageUrl && (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg">
              <Image
                src={post.imageUrl}
                alt={post.content.substring(0, 100)}
                fill
                className="object-cover"
              />
            </div>
          )}

          {post.subject && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Subject:</span>
              <span className="text-sm font-medium">{post.subject}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between w-full p-4">
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
        </CardFooter>
      </Card>

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
    </div>
  );
}

