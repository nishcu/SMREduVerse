
'use client';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { TutorCard } from '@/components/tutor-card';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type User, type Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection } from '@/firebase';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

function TutorCardSkeleton() {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <Skeleton className="h-12 w-full" />
                <div>
                    <Skeleton className="h-5 w-1/4 mb-2" />
                    <div className="space-y-2">
                         <Skeleton className="h-12 w-full" />
                         <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
}


export default function TutorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('followersCount');
  const [subject, setSubject] = useState('all');

  const tutorsQuery = useMemo(() => query(collectionGroup(db, 'profile')), []);
  const { data: tutors, loading, error } = useCollection<User>(tutorsQuery);

  const coursesQuery = useMemo(() => collection(db, 'courses'), []);
  const { data: courses, loading: loadingCourses, error: errorCourses } = useCollection<Course>(coursesQuery);

  const subjects = useMemo(() => ['all', ...Array.from(new Set(courses?.map(doc => doc.subject) || []))], [courses]);

  const filteredAndSortedTutors = useMemo(() => {
    if (!tutors) return [];
  
    const filteredTutors = tutors.filter((tutor) => {
      const nameMatch = tutor.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (subject === 'all') {
        return nameMatch;
      }
  
      const tutorCourses = courses?.filter(doc => doc.instructorId === tutor.id) || [];
      const subjectMatch = tutorCourses.some(c => c.subject === subject);
      
      return nameMatch && subjectMatch;
    });
  
    return filteredTutors.sort((a: any, b: any) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'courses') {
        const courseCountA = courses?.filter(doc => doc.instructorId === a.id).length || 0;
        const courseCountB = courses?.filter(doc => doc.instructorId === b.id).length || 0;
        return courseCountB - courseCountA;
      }
      return b[sortBy] - a[sortBy];
    });
  }, [tutors, courses, searchTerm, subject, sortBy]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Tutors Directory
        </h1>
        <p className="text-muted-foreground">
          Discover knowledgeable tutors and course creators in the community.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search tutors by name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
            <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
                {subjects.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
            </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="followersCount">Most Followers</SelectItem>
                <SelectItem value="courses">Most Courses</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </div>
      
      {loading || loadingCourses ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => <TutorCardSkeleton key={i} />)}
          </div>
      ) : error || errorCourses ? (
          <p className="text-destructive">Error loading tutors. Please try again later.</p>
      ) : filteredAndSortedTutors && filteredAndSortedTutors.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedTutors.map(tutor => {
                const tutorCourses = courses?.filter(doc => doc.instructorId === tutor.id) || [];
                return <TutorCard key={tutor.id} tutor={tutor} courses={tutorCourses} />;
            })}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          <p>No tutors found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
