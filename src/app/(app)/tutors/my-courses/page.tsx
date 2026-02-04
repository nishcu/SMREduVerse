'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from '@/firebase';
import { collection, query, where, orderBy, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, PlusCircle, Users, Coins, TrendingUp, Calendar, Edit, Eye, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function CourseStatsCard({ course }: { course: Course }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2">{course.description}</CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">{course.subject}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{course.enrollmentCount || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Enrollments</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{course.knowledgeCoins || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Price</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{(course.enrollmentCount || 0) * (course.knowledgeCoins || 0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/courses/${course.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/courses/${course.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/courses/${course.id}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyCoursesPage() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const coursesQuery = useMemo(() => {
    if (!user?.id) return null;
    return query(
      collection(db, 'courses'),
      where('instructorId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [user?.id]);

  const { data: courses, loading, error } = useCollection<Course>(coursesQuery);

  const publishedCourses = courses?.filter(c => c.enrollmentCount !== undefined) || [];
  const draftCourses = courses?.filter(c => c.enrollmentCount === undefined) || [];

  const totalRevenue = publishedCourses.reduce((sum, course) => {
    return sum + ((course.enrollmentCount || 0) * (course.knowledgeCoins || 0));
  }, 0);

  const totalEnrollments = publishedCourses.reduce((sum, course) => {
    return sum + (course.enrollmentCount || 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error loading courses: {error.message}</p>;
  }

  const filteredCourses = activeTab === 'published' 
    ? publishedCourses 
    : activeTab === 'drafts' 
    ? draftCourses 
    : courses || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            My Courses
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your courses, track performance, and grow your teaching business.
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{courses?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">Knowledge Coins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {publishedCourses.length > 0 
                ? Math.round(publishedCourses.reduce((sum, c) => sum + (c.knowledgeCoins || 0), 0) / publishedCourses.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per Course</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Courses ({courses?.length || 0})</TabsTrigger>
          <TabsTrigger value="published">Published ({publishedCourses.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftCourses.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <CourseStatsCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">No courses yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create your first course to start teaching!</p>
                <Button asChild>
                  <Link href="/courses/create">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="published" className="space-y-4">
          {publishedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedCourses.map(course => (
                <CourseStatsCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No published courses yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="drafts" className="space-y-4">
          {draftCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftCourses.map(course => (
                <CourseStatsCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No draft courses yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


