
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, BrainCircuit, Users, Coins, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Course, Enrollment, Transaction } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';


function StatCard({ title, value, icon, isLoading, href }: { title: string; value: string | number; icon: React.ReactNode; isLoading?: boolean, href: string }) {
    const cardContent = (
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    )
    
    return (
        <motion.div whileHover={{ scale: 1.05, y: -5 }} className="h-full">
            <Link href={href} className="h-full block">
                {cardContent}
            </Link>
        </motion.div>
    )
}

export default function DashboardPage() {
  const { user } = useAuth();

  // --- Data Fetching ---
  const userRef = useMemo(() => (user ? doc(db, `users/${user.id}/profile/${user.id}`) : null), [user?.id]);
  const { data: userData, loading: loadingUser } = useDoc<User>(userRef);

  const enrollmentsQuery = useMemo(() => (user ? query(collection(db, `users/${user.id}/enrollments`), orderBy('lastAccessed', 'desc'), limit(1)) : null), [user?.id]);
  const { data: latestEnrollments, loading: loadingEnrollments } = useCollection<Enrollment>(enrollmentsQuery);

  const latestCourseId = latestEnrollments?.[0]?.id;
  const courseRef = useMemo(() => (latestCourseId ? doc(db, `courses/${latestCourseId}`) : null), [latestCourseId]);
  const { data: latestCourse, loading: loadingCourse } = useDoc<Course>(courseRef);

  const transactionsQuery = useMemo(() => (user ? query(collection(db, `users/${user.id}/transactions`), orderBy('createdAt', 'desc'), limit(5)) : null), [user?.id]);
  const { data: transactions, loading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const enrolledCoursesQuery = useMemo(() => (user ? collection(db, 'users', user.id, 'enrollments') : null), [user?.id]);
  const { data: allEnrollments, loading: loadingAllEnrollments } = useCollection(enrolledCoursesQuery);

  const isLoading = loadingUser || loadingEnrollments || loadingCourse || loadingTransactions || loadingAllEnrollments;
  const placeholderImage = latestCourse ? PlaceHolderImages.find((p) => p.id === latestCourse.id) : null;
  const courseProgress = latestEnrollments?.[0]?.progress?.overallPercentage ?? 0;

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="font-headline text-3xl md:text-4xl font-semibold">
                Welcome back, {user ? user.name.split(' ')[0] : ''}!
            </h1>
            <p className="text-muted-foreground">Here's your overview for today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Knowledge Coins" value={userData?.wallet?.knowledgeCoins ?? '...'} icon={<Coins />} isLoading={isLoading} href="/wallet" />
            <StatCard title="Courses in Progress" value={allEnrollments?.length ?? '...'} icon={<BookOpen />} isLoading={isLoading} href="/my-classes" />
            <StatCard title="Lifetime Points" value={userData?.knowledgePoints ?? '...'} icon={<TrendingUp />} isLoading={isLoading} href="/wallet" />
            <StatCard title="Followers" value={userData?.followersCount ?? '...'} icon={<Users />} isLoading={isLoading} href={`/profile/${user?.id}`} />
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                 <motion.div whileHover={{ scale: 1.02 }} className="h-full">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Continue Learning</CardTitle>
                            <CardDescription>Jump back into your most recent course.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Skeleton className="h-40 w-full" />
                            ) : latestCourse ? (
                                <Link href={`/my-classes/${latestCourse.id}`} className="block rounded-lg border p-4 transition-colors hover:bg-secondary">
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="relative h-24 w-full sm:w-32 shrink-0 overflow-hidden rounded-md">
                                            <Image src={placeholderImage?.imageUrl || latestCourse.imageUrl} alt={latestCourse.title} fill className="object-cover" />
                                        </div>
                                        <div className="flex-grow w-full">
                                            <p className="text-sm text-muted-foreground">{latestCourse.subject}</p>
                                            <h3 className="font-bold text-lg">{latestCourse.title}</h3>
                                            <Progress value={courseProgress} className="my-2 h-2" />
                                            <p className="text-xs text-muted-foreground">{courseProgress}% complete</p>
                                        </div>
                                        <Button asChild className="w-full sm:w-auto mt-2 sm:mt-0">
                                            <div className="flex items-center">
                                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                                            </div>
                                        </Button>
                                    </div>
                                </Link>
                            ) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <p>You are not enrolled in any courses yet.</p>
                                    <Button asChild variant="link">
                                        <Link href="/courses">Explore Courses</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                 </motion.div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {isLoading ? (
                           <div className="space-y-3">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                           </div>
                       ) : transactions && transactions.length > 0 ? (
                           <ul className="space-y-3">
                               {transactions.map(tx => (
                                   <li key={tx.id} className="flex items-center text-sm">
                                        {tx.transactionType === 'earn' ? <TrendingUp className="h-5 w-5 mr-3 text-green-500" /> : <TrendingDown className="h-5 w-5 mr-3 text-red-500" />}
                                        <span className="flex-grow truncate">{tx.description}</span>
                                        <span className={cn("font-semibold", tx.transactionType === 'earn' ? 'text-green-600' : 'text-red-600')}>
                                            {tx.transactionType === 'earn' ? '+' : '-'}{tx.points}
                                        </span>
                                   </li>
                               ))}
                           </ul>
                       ) : (
                           <p className="text-sm text-center text-muted-foreground py-4">No recent activity.</p>
                       )}
                    </CardContent>
                    <CardFooter>
                         <Button variant="secondary" className="w-full" asChild>
                            <Link href="/wallet">
                                View All Transactions
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
