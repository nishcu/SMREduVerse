
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course, Chapter } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Edit, PlusCircle } from 'lucide-react';
import Link from 'next/link';

function EditCoursePageSkeleton() {
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

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const router = useRouter();

  const courseRef = doc(db, 'courses', courseId) as DocumentReference<Course>;
  const { data: course, loading: loadingCourse, error: errorCourse } = useDoc<Course>(courseRef);

  const chaptersQuery = query(collection(db, 'courses', courseId, 'chapters'), orderBy('order'));
  const { data: chapters, loading: loadingChapters, error: errorChapters } = useCollection<Chapter>(chaptersQuery);

  const isLoading = loadingCourse || loadingChapters;
  const error = errorCourse || errorChapters;

  if (isLoading) {
    return <EditCoursePageSkeleton />;
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  if (!course) {
    return <p>Course not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2"/>
            Back to Course
        </Button>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Editing: {course.title}
        </h1>
        <p className="text-muted-foreground">
          Manage the chapters and lessons for your course.
        </p>
      </div>
      
      <Card>
        <CardHeader className="flex-row items-center justify-between">
            <div>
                <CardTitle>Chapters</CardTitle>
                <CardDescription>The curriculum for your course.</CardDescription>
            </div>
            <Button asChild>
                <Link href={`/courses/${courseId}/chapters/create`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Chapter
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
            {chapters && chapters.length > 0 ? (
                chapters.map(chapter => (
                    <div key={chapter.id} className="flex items-center rounded-lg border p-3">
                        <BookOpen className="mr-4 h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="font-semibold">{chapter.title}</p>
                            <p className="text-xs text-muted-foreground">Chapter {chapter.order}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/courses/${courseId}/chapters/${chapter.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4"/>
                                Manage
                           </Link>
                        </Button>
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground p-8">
                    <p>No chapters have been added yet. Click "Add Chapter" to get started.</p>
                </div>
            )}
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
