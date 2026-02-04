
'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Clock, Coins, PlusCircle, Share2, User as UserIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { doc, Timestamp, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Course, type Enrollment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { CourseCurriculum } from '@/components/course-curriculum';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { useDoc } from '@/firebase';
import { use, useMemo } from 'react';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const courseRef = useMemo(() => doc(db, 'courses', id) as DocumentReference<Course>, [id]);
  const { data: course, loading: loadingCourse, error: errorCourse } = useDoc<Course>(courseRef);

  const enrollmentRef = useMemo(() => (user ? doc(db, `users/${user.id}/enrollments`, id) : null), [user?.id, id]);
  const { data: enrollment, loading: loadingEnrollment, error: errorEnrollment } = useDoc<Enrollment>(enrollmentRef as DocumentReference<Enrollment> | null);

  const loading = loadingCourse || loadingEnrollment;

  if (loading) {
    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 w-full rounded-xl" />
             <Skeleton className="h-32 w-full" />
             <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
    )
  }

  if (errorCourse || errorEnrollment) {
    return <p className="text-destructive">Error: {errorCourse?.message || errorEnrollment?.message}</p>;
  }

  if (!course) {
    notFound();
  }

  const placeholderImage = PlaceHolderImages.find(p => p.id === course.id);

  const completionPercentage = enrollment?.progress.overallPercentage || 0;

  const startDate = course.startDate && (course.startDate as Timestamp).toDate();
  
  const isInstructor = user?.id === course.instructorId;

  const handleShare = () => {
    const shareText = `I just enrolled in the "${course.title}" course on GenZeerr! #learning #education`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Check out this course: ${course.title}`,
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="relative h-64 w-full overflow-hidden rounded-xl">
          <Image
            src={placeholderImage?.imageUrl || course.imageUrl}
            alt={course.title}
            fill
            className="object-cover"
            data-ai-hint={placeholderImage?.imageHint}
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           <div className="absolute bottom-6 left-6">
                <h1 className="font-headline text-4xl font-bold text-white">{course.title}</h1>
                <p className="text-lg text-white/90">{course.description}</p>
           </div>
        </div>
        
        <div className="flex justify-end gap-2">
            {isInstructor && (
                <Button asChild>
                    <Link href={`/courses/${course.id}/edit`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Edit Course
                    </Link>
                </Button>
            )}
            <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share to Feed
            </Button>
        </div>
        
        <CourseCurriculum courseId={course.id} enrollment={enrollment} />

      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completionPercentage} />
            <p className="text-center text-sm text-muted-foreground">{completionPercentage}% Complete</p>
            <Button className="w-full">
                {completionPercentage > 0 ? 'Continue Next Lesson' : 'Start Course'}
            </Button>
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>Key information about this course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                 <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span><span className="font-semibold">Duration:</span> {course.duration}</span>
                </div>
                 <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span><span className="font-semibold">Starts:</span> {startDate ? format(startDate, 'PPP') : 'Not specified'}</span>
                </div>
                 <div className="flex items-center">
                    <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span><span className="font-semibold">Cost:</span> {course.knowledgeCoins} Coins</span>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
                <Link href={`/profile/${course.instructorId}`} className="group flex items-center gap-3">
                     <UserIcon className="h-6 w-6 text-muted-foreground" />
                    <p className="font-semibold group-hover:underline">{course.instructorName}</p>
                </Link>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
