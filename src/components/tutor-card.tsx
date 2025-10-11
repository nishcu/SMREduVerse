'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Users, ArrowRight, Video } from 'lucide-react';
import type { User, Course } from '@/lib/types';
import Image from 'next/image';

export function TutorCard({ tutor, courses }: { tutor: User, courses: Course[] }) {
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
  };

  const topCourses = courses.slice(0, 2);
  // We don't have study rooms in firestore yet, so we'll hardcode this for now.
  const studyRoomsCount = 0; 

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary">
          <AvatarImage src={tutor.avatarUrl} alt={tutor.name} />
          <AvatarFallback>{getInitials(tutor.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="font-headline text-2xl">{tutor.name}</CardTitle>
          <CardDescription className="line-clamp-2">{tutor.bio}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex justify-around rounded-lg bg-secondary p-2 text-center text-sm">
          <div className="flex flex-col items-center gap-1">
             <Users className="h-5 w-5 text-secondary-foreground" />
            <p className="font-bold">{tutor.followersCount}</p>
            <p className="text-xs">Followers</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BookOpen className="h-5 w-5 text-secondary-foreground" />
            <p className="font-bold">{courses.length}</p>
            <p className="text-xs">Courses</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Video className="h-5 w-5 text-secondary-foreground" />
            <p className="font-bold">{studyRoomsCount}</p>
            <p className="text-xs">Rooms</p>
          </div>
        </div>
        
        <div>
            <h4 className="mb-2 font-semibold">Top Courses</h4>
            <div className="space-y-2">
                {topCourses.length > 0 ? topCourses.map(course => (
                    <Link href={`/courses/${course.id}`} key={course.id} className="group flex items-center gap-3 rounded-md p-2 hover:bg-secondary">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                            <Image src={course.imageUrl} alt={course.title} fill className="object-cover" />
                        </div>
                        <div>
                            <p className="font-medium line-clamp-1 group-hover:underline">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.enrollmentCount} learners</p>
                        </div>
                    </Link>
                )) : (
                    <p className="text-xs text-muted-foreground">No courses created yet.</p>
                )}
            </div>
        </div>

      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/profile/${tutor.id}`}>
            View Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
