
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course, Chapter, Lesson } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Edit, PlusCircle } from 'lucide-react';
import Link from 'next/link';

function EditChapterPageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-6 w-3/4" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditChapterPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id: courseId, chapterId } = use(params);
  const router = useRouter();

  const chapterRef = doc(db, 'courses', courseId, 'chapters', chapterId) as DocumentReference<Chapter>;
  const { data: chapter, loading: loadingChapter, error: errorChapter } = useDoc<Chapter>(chapterRef);

  const lessonsQuery = query(collection(db, 'courses', courseId, 'chapters', chapterId, 'lessons'), orderBy('order'));
  const { data: lessons, loading: loadingLessons, error: errorLessons } = useCollection<Lesson>(lessonsQuery);

  const isLoading = loadingChapter || loadingLessons;
  const error = errorChapter || errorLessons;

  if (isLoading) {
    return <EditChapterPageSkeleton />;
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!chapter) {
    return <p>Chapter not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2" />
          Back to Course
        </Button>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Editing: {chapter.title}
        </h1>
        <p className="text-muted-foreground">Manage the lessons within this chapter.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>All lessons for this chapter.</CardDescription>
          </div>
           <Button asChild>
                <Link href={`/courses/${courseId}/chapters/${chapterId}/lessons/create`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Lesson
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lessons && lessons.length > 0 ? (
              lessons.map(lesson => (
                <div key={lesson.id} className="flex items-center rounded-lg border p-3">
                  <BookOpen className="mr-4 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-semibold">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{lesson.contentType}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground p-8">
                <p>No lessons have been added to this chapter yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
