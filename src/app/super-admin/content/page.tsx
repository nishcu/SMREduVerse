'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getPostsAction } from './actions';
import { ContentManagementClient } from './client';
import type { Post } from '@/lib/types';
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      const postsData = await getPostsAction();
      setPosts(postsData);
      setIsLoading(false);
    }
    loadPosts();
  }, []);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Content Moderation
        </h1>
        <p className="text-muted-foreground">
          Review and manage user-generated posts.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>A list of all posts on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContentManagementClient initialPosts={posts} />
        </CardContent>
      </Card>
    </div>
  );
}
