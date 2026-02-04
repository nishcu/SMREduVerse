'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { CreatePostDialog } from './create-post-dialog';
import { PostsFeed } from './posts-feed';

export default function SocialPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold md:text-4xl">
              Social Feed
            </h1>
            <p className="text-muted-foreground">
              See what's happening in the community.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </div>

        <Tabs defaultValue="for-you" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you">
            <PostsFeed feedType="for-you" />
          </TabsContent>
          <TabsContent value="following">
            <PostsFeed feedType="following" />
          </TabsContent>
          <TabsContent value="trending">
            <PostsFeed feedType="trending" />
          </TabsContent>
        </Tabs>
      </div>
      <CreatePostDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
