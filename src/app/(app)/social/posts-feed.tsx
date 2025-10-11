
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
import { useState } from 'react';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(false);

  const createdAt = post.createdAt?.toDate();
  const timeAgo = createdAt ? formatDistanceToNow(createdAt, { addSuffix: true }) : 'just now';

  const isOwnPost = user?.id === post.author.uid;
  // In a real app, this would come from the user's data
  const isFollowing = false; 

  const handleLike = () => {
    // In a real app, this would call a server action to update the database
    if (isLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleFollow = () => {
    toast({
      title: 'Followed!',
      description: `You are now following ${post.author.name}.`,
    });
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
            {!isOwnPost && !isFollowing && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <button onClick={handleFollow} className="text-xs font-semibold text-primary hover:underline">
                  Follow
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
               <DropdownMenuItem onClick={handleFollow}>
                <UserPlus className="mr-2 h-4 w-4" />
                Follow {post.author.name}
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
      <CardFooter className="flex justify-between border-t p-2">
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" onClick={handleLike}>
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{likes}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" onClick={() => toast({ title: 'Coming Soon!', description: 'Commenting functionality is under development.'})}>
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments}</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function PostsFeed() {
  const postsQuery = useMemo(() => query(collection(db, 'posts'), orderBy('createdAt', 'desc')), []);
  const { data: posts, loading, error } = useCollection<Post>(postsQuery);

  if (loading) {
    return (
      <div className="space-y-6">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        <p>Error loading posts: {error.message}</p>
      </div>
    );
  }

  if (posts?.length === 0) {
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
