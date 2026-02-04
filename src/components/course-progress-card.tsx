
'use client';
import type { Enrollment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Skeleton } from './ui/skeleton';

interface CourseProgressCardProps {
    enrollment: Enrollment;
}

export function CourseProgressCardSkeleton() {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="relative h-40 w-full overflow-hidden rounded-lg">
                    <Skeleton className="h-full w-full" />
                </div>
                 <Skeleton className="h-6 w-3/4 pt-4" />
                 <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-1/4" />
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
}

export function CourseProgressCard({ enrollment }: CourseProgressCardProps) {
  const placeholderImage = PlaceHolderImages.find((p) => p.id === enrollment.courseId);
  const progress = enrollment.progress?.overallPercentage || 0;
  const isCompleted = progress === 100;

  return (
    <Card key={enrollment.id} className="flex flex-col">
      <CardHeader>
        <div className="relative h-40 w-full overflow-hidden rounded-lg">
          <Image
            src={placeholderImage?.imageUrl || enrollment.courseImageUrl}
            alt={enrollment.courseTitle}
            fill
            className="object-cover"
            data-ai-hint={placeholderImage?.imageHint}
          />
        </div>
        <CardTitle className="pt-4 font-headline">{enrollment.courseTitle}</CardTitle>
        <CardDescription>By {enrollment.courseInstructor}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <Progress value={progress} />
        <p className="text-sm text-muted-foreground">{progress}% Complete</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/my-classes/${enrollment.courseId}`}>
            {isCompleted ? 'Review Course' : 'Continue Course'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
