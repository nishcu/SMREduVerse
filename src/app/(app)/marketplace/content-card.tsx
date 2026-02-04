'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { purchaseContentAction } from './actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Download, Coins, FileText, Video, Brain, BookOpen, Zap, CheckCircle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { MarketplaceContent } from '@/lib/types';

const typeIcons = {
  study_notes: FileText,
  video_tutorial: Video,
  practice_quiz: Brain,
  flashcards: Zap,
  study_guide: BookOpen,
};

interface ContentCardProps {
  content: MarketplaceContent & {
    createdAt?: string;
    updatedAt?: string;
  };
  onPurchase?: () => void;
}

export function ContentCard({ content, onPurchase }: ContentCardProps) {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isOwned, setIsOwned] = useState(false); // This would need to be checked from user's purchases

  const Icon = typeIcons[content.type] || FileText;
  const isCreator = user?.id === content.creator.uid;
  const isFree = content.price === 0;

  const handlePurchase = async () => {
    if (!firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please sign in to purchase content.',
      });
      return;
    }

    if (isCreator) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You cannot purchase your own content.',
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await purchaseContentAction(content.id, idToken);
      
      if (result.success) {
        setIsOwned(true);
        toast({
          title: 'Success',
          description: 'Content purchased successfully!',
        });
        onPurchase?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to purchase content.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to purchase content.',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg line-clamp-2">{content.title}</CardTitle>
          </div>
          <Badge variant="secondary">{content.type.replace('_', ' ')}</Badge>
        </div>
        <CardDescription className="line-clamp-2">{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href={`/profile/${content.creator.uid}`} className="flex items-center gap-2 hover:underline">
            <Avatar className="h-6 w-6">
              <AvatarImage src={content.creator.avatarUrl} />
              <AvatarFallback className="text-xs">{getInitials(content.creator.name)}</AvatarFallback>
            </Avatar>
            <span>{content.creator.name}</span>
            {content.creator.verified && (
              <Badge variant="outline" className="text-xs">Verified</Badge>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>{content.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({content.reviewsCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{content.downloads} downloads</span>
          </div>
        </div>
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">
            {isFree ? 'Free' : `${content.price} coins`}
          </span>
        </div>
        {isCreator ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/marketplace/${content.id}`}>
              View
            </Link>
          </Button>
        ) : isOwned ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/marketplace/${content.id}`}>
              <CheckCircle className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handlePurchase}
            disabled={isPurchasing || !firebaseUser}
          >
            {isPurchasing ? (
              <>Purchasing...</>
            ) : (
              <>
                {isFree ? 'Get Free' : 'Purchase'}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

