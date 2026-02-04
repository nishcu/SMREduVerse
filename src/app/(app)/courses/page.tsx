
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase';
import { useMemo } from 'react';

function CourseCardSkeleton() {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                    <Skeleton className="h-full w-full" />
                </div>
                 <Skeleton className="h-6 w-3/4 pt-4" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex-grow">
                 <Skeleton className="h-6 w-1/4" />
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}


export default function CoursesPage() {
  const coursesQuery = useMemo(() => query(collection(db, 'courses'), orderBy('createdAt', 'desc')), []);
  const { data: courses, loading, error } = useCollection<Course>(coursesQuery);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            Explore Courses
          </h1>
          <p className="text-muted-foreground">
            Expand your knowledge with our wide range of courses.
          </p>
        </div>
        <Button asChild>
            <Link href="/courses/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Course
            </Link>
        </Button>
      </div>

       {loading && (
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
         </div>
       )}

       {error && <p className="text-destructive">Error loading courses: {error.message}</p>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses?.map((course) => {
          const placeholderImage = PlaceHolderImages.find(
            (p) => p.id === course.id
          );
          return (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                  <Image
                    src={placeholderImage?.imageUrl || course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                    data-ai-hint={placeholderImage?.imageHint}
                  />
                </div>
                <CardTitle className="pt-4 font-headline">
                  {course.title}
                </CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Badge variant="secondary">By {course.instructorName}</Badge>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/courses/${course.id}`}>
                    View Course <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {!loading && courses?.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p>No courses have been created yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
