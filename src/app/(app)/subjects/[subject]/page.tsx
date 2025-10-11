'use client';

import { useParams, useRouter } from 'next/navigation';
import { PostsFeed } from '@/app/(app)/social/posts-feed';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Helper to format the subject key from the URL into a readable title
const formatSubjectTitle = (subjectKey: string) => {
  return subjectKey
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectKey = params.subject as string;
  const subjectTitle = formatSubjectTitle(subjectKey);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="icon">
            <ArrowLeft />
            <span className="sr-only">Back to Subjects</span>
        </Button>
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            {subjectTitle}
          </h1>
          <p className="text-muted-foreground">
            Posts and discussions related to {subjectTitle}.
          </p>
        </div>
      </div>

      {/* In a real app, you would pass the subjectKey to PostsFeed to filter posts */}
      <PostsFeed />
    </div>
  );
}
