import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getContestsAction } from './actions';
import { ContestManagementClient } from './client';
import type { Contest } from '@/lib/types';

export default async function AdminContestsPage() {
  const contests = await getContestsAction() as Contest[];

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
