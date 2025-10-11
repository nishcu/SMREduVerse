import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getPostsAction, deletePostAction } from './actions';
import { ContentManagementClient } from './client';
import type { Post } from '@/lib/types';

export default async function AdminContentPage() {
  const posts = await getPostsAction();

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
