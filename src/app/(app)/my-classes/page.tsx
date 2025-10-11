
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Enrollment } from '@/lib/types';
import { useMemo }from 'react';
import { School, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CourseProgressCard, CourseProgressCardSkeleton } from '@/components/course-progress-card';

export default function MyClassesPage() {
  const { user } = useAuth();

  const enrollmentsQuery = useMemo(
    () => (user ? query(collection(db, 'users', user.id, 'enrollments'), orderBy('lastAccessed', 'desc')) : null),
    [user?.id]
  );
  const { data: enrollments, loading: loadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const isLoading = loadingEnrollments;

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <CourseProgressCardSkeleton key={i} />)}
            </div>
        );
    }
    if (enrollments && enrollments.length > 0) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
                <CourseProgressCard key={enrollment.id} enrollment={enrollment} />
            ))}
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-16 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-4 text-2xl font-semibold">You're Not Enrolled in Any Courses</h2>
            <p className="mt-2 text-muted-foreground">Start exploring subjects and enroll in a course to begin learning!</p>
            <Button asChild className="mt-6">
                <Link href="/courses">Explore Subjects</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <School className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            My Classes
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey and track your progress.
          </p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
