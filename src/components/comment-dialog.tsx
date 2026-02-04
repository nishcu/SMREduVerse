'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createCommentAction, getCommentsAction } from '@/app/(app)/social/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  author: {
    uid: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: any;
}

interface CommentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthorId: string;
  initialCommentCount?: number;
  onCommentAdded?: () => void;
}

export function CommentDialog({ isOpen, onOpenChange, postId, postAuthorId, initialCommentCount, onCommentAdded }: CommentDialogProps) {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');

  const loadComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const result = await getCommentsAction(postId);
      if (result.success && result.comments) {
        // Sort comments by creation time (newest first)
        const sortedComments = result.comments.sort((a: Comment, b: Comment) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime; // Newest first
        });
        setComments(sortedComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    } else {
      setComments([]);
      setCommentText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId]);
  
  // Auto-refresh comments periodically when dialog is open
  useEffect(() => {
    if (!isOpen || !postId) return;
    
    const interval = setInterval(() => {
      loadComments();
    }, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !firebaseUser || !user) {
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await createCommentAction(postId, commentText, idToken);
      
      if (result.success) {
        setCommentText('');
        toast({ title: 'Success', description: 'Comment added!' });
        await loadComments(); // Reload comments
        onCommentAdded?.(); // Notify parent to update comment count
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to add comment' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add comment' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments {initialCommentCount !== undefined && `(${initialCommentCount})`}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Link href={`/profile/${comment.author.uid}`}>
                    <Avatar className="h-10 w-10 cursor-pointer">
                      <AvatarImage src={comment.author.avatarUrl} />
                      <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/profile/${comment.author.uid}`} className="font-semibold text-sm hover:underline">
                        {comment.author.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {user && (
          <form onSubmit={handleSubmit} className="space-y-2 pt-4 border-t">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={!commentText.trim() || submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Comment
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
