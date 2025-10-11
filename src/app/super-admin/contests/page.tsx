'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getContestsAction } from './actions';
import { ContestManagementClient } from './client';
import type { Contest } from '@/lib/types';
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}


export default function AdminContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContests() {
        setIsLoading(true);
        const contestsData = await getContestsAction();
        setContests(contestsData as Contest[]);
        setIsLoading(false);
    }
    loadContests();
  }, []);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Contest Management
        </h1>
        <p className="text-muted-foreground">
          Create, edit, and manage all platform contests.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Contests</CardTitle>
          <CardDescription>A list of all contests on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContestManagementClient initialContests={contests} />
        </CardContent>
      </Card>
    </div>
  );
}
