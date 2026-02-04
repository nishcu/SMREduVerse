'use client';

import { use } from 'react';
import { useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course, Enrollment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { Users, TrendingUp, Coins, Clock, BookOpen, Award, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CourseAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { user } = useAuth();

  const courseRef = doc(db, 'courses', courseId) as DocumentReference<Course>;
  const { data: course, loading: loadingCourse } = useDoc<Course>(courseRef);

  const enrollmentsQuery = query(collection(db, `users`), orderBy('createdAt', 'desc'));
  // Note: This is a simplified query. In production, you'd want a proper enrollments collection
  const { data: enrollments, loading: loadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const loading = loadingCourse || loadingEnrollments;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!course) {
    return <p>Course not found.</p>;
  }

  // Check if user is the instructor
  const isInstructor = user?.id === course.instructorId;
  if (!isInstructor) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">You don't have permission to view analytics for this course.</p>
          <Button asChild className="mt-4">
            <Link href={`/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate analytics (simplified - in production, fetch actual enrollment data)
  const totalEnrollments = course.enrollmentCount || 0;
  const totalRevenue = totalEnrollments * (course.knowledgeCoins || 0);
  const completionRate = 0; // Would calculate from enrollment progress
  const averageRating = 0; // Would calculate from reviews

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Course Analytics
          </h1>
          <p className="text-muted-foreground mt-2">{course.title}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground mt-1">Students enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">Knowledge Coins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Students completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 5.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
              <CardDescription>Key insights about your course performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Course Price</p>
                  <p className="text-2xl font-bold">{course.knowledgeCoins || 0} Coins</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="text-2xl font-bold">{course.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">{course.duration || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-2xl font-bold">
                    {course.createdAt ? new Date(course.createdAt as any).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Statistics</CardTitle>
              <CardDescription>Track your course enrollment over time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Enrollment analytics will be displayed here.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Total enrollments: <span className="font-semibold">{totalEnrollments}</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Track your course revenue and earnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">{totalRevenue}</p>
                  <p className="text-xs text-muted-foreground mt-1">Knowledge Coins</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Per Enrollment</p>
                  <p className="text-3xl font-bold">{course.knowledgeCoins || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Knowledge Coins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Performance</CardTitle>
              <CardDescription>Student engagement and completion metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold">{completionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-3xl font-bold">{averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


