
'use client';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course, Lesson, Enrollment, User, LessonContent } from '@/lib/types';
import { toggleLessonCompletionAction, updateLastAccessedAction } from '../actions';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Circle, Play, BookOpen } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { LessonPlayer } from '@/components/lesson-player';
import { InstructorCard } from '@/components/instructor-card';

function PageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <div className="space-y-3 pt-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default function MyClassDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { user, firebaseUser } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null);

  const courseRef = useMemo(() => doc(db, 'courses', courseId), [courseId]);
  const { data: course, loading: loadingCourse } = useDoc<Course>(courseRef as DocumentReference<Course>);

  const lessonsQuery = useMemo(() => query(collection(db, 'courses', courseId, 'lessons'), orderBy('order')), [courseId]);
  const { data: lessons, loading: loadingLessons } = useCollection<Lesson>(lessonsQuery);
  
  const enrollmentRef = useMemo(() => (user ? doc(db, 'users', user.id, 'enrollments', courseId) : null), [user?.id, courseId]);
  const { data: enrollment, loading: loadingEnrollment } = useDoc<Enrollment>(enrollmentRef as DocumentReference<Enrollment> | null);

  const instructorRef = useMemo(() => (course ? doc(db, 'users', course.instructorId, 'profile', course.instructorId) : null), [course?.instructorId]);
  const { data: instructor, loading: loadingInstructor } = useDoc<User>(instructorRef as DocumentReference<User> | null);
  
  useEffect(() => {
    if (firebaseUser && courseId) {
      updateLastAccessedAction(firebaseUser.uid, courseId);
    }
  }, [firebaseUser, courseId]);

  const handleToggleLesson = async (lessonId: string, currentStatus: boolean) => {
    if (!firebaseUser) return;
    await toggleLessonCompletionAction(firebaseUser.uid, courseId, lessonId, !currentStatus);
  };
  
  const handlePlayLesson = (lesson: Lesson) => {
    if (!course) return;
    setSelectedLesson({
      courseTitle: course.title,
      lessonTitle: lesson.title,
      contentUrl: lesson.contentUrl,
      notes: lesson.description || "No notes for this lesson."
    });
  }

  const isLoading = loadingCourse || loadingLessons || loadingEnrollment || loadingInstructor;

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!course) {
    notFound();
  }
  
  const completedLessons = enrollment?.progress?.chapters['main']?.lessons || {};

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
            <p className="text-sm font-semibold text-primary">{course.subject}</p>
            <h1 className="font-headline text-3xl font-bold md:text-4xl">{course.title}</h1>
            <p className="text-muted-foreground mt-2">{course.description}</p>
        </div>
        
        <div className="space-y-3">
            <h2 className="font-headline text-2xl font-semibold">Lessons</h2>
            {lessons && lessons.length > 0 ? lessons.map(lesson => {
                const isCompleted = completedLessons[lesson.id]?.completed || false;
                return (
                    <div key={lesson.id} className="flex items-center rounded-lg border bg-card p-3 transition-colors hover:bg-secondary/50">
                        <button onClick={() => handleToggleLesson(lesson.id, isCompleted)} className="flex items-center gap-3">
                           {isCompleted ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                        </button>
                        <div className="ml-4 flex-1 cursor-pointer" onClick={() => handleToggleLesson(lesson.id, isCompleted)}>
                            <p className="font-semibold">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.contentType}</p>
                        </div>
                        <Sheet open={selectedLesson?.lessonTitle === lesson.title} onOpenChange={(open) => !open && setSelectedLesson(null)}>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handlePlayLesson(lesson)}>
                                <Play className="h-5 w-5"/>
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-2xl">
                               {selectedLesson?.lessonTitle === lesson.title && <LessonPlayer lesson={selectedLesson} />}
                          </SheetContent>
                        </Sheet>
                    </div>
                )
            }) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-xl font-semibold">No Lessons Yet</h3>
                  <p className="mt-2 text-muted-foreground">The instructor is still preparing the content for this course.</p>
              </div>
            )}
        </div>

      </div>
      <div className="space-y-6">
        {instructor && <InstructorCard instructor={instructor} />}
      </div>
    </div>
  );
}
