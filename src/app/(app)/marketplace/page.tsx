'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Star, Download, Coins, Sparkles, FileText, Video, Brain, BookOpen, Zap } from 'lucide-react';
import { CreateContentDialog } from './create-content-dialog';
import { ContentCard } from './content-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMarketplaceContentAction } from './actions';
import type { MarketplaceContent } from '@/lib/types';

function ContentSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function MarketplacePage() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [content, setContent] = useState<MarketplaceContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadContent();
  }, [selectedSubject, selectedType]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const result = await getMarketplaceContentAction(
        selectedSubject !== 'all' ? selectedSubject : undefined,
        selectedType !== 'all' ? selectedType : undefined,
        20
      );
      if (result.success) {
        setContent(result.content as any);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to load marketplace content.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load marketplace content.',
      });
    } finally {
      setLoading(false);
    }
  };

  const subjects = ['All', 'Mathematics', 'Science', 'History', 'English', 'Computer Science', 'Physics', 'Chemistry'];
  const types = ['All', 'Study Notes', 'Video Tutorial', 'Practice Quiz', 'Flashcards', 'Study Guide'];

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold md:text-4xl flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Knowledge Marketplace
            </h1>
            <p className="text-muted-foreground">
              Buy and sell study materials, notes, and educational content.
            </p>
          </div>
          {firebaseUser && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Content
            </Button>
          )}
        </div>

        <div className="flex gap-4 flex-wrap">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject === 'All' ? 'all' : subject.toLowerCase()}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type} value={type === 'All' ? 'all' : type.toLowerCase().replace(' ', '_')}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ContentSkeleton />
            <ContentSkeleton />
            <ContentSkeleton />
          </div>
        ) : content.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">No content available yet</p>
            <p>Be the first to create educational content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.map((item) => (
              <ContentCard key={item.id} content={item as any} onPurchase={() => loadContent()} />
            ))}
          </div>
        )}
      </div>
      {firebaseUser && (
        <CreateContentDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) loadContent();
          }}
        />
      )}
    </>
  );
}

