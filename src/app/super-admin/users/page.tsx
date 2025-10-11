import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getUsersAction } from './actions';
import { UserManagementClient } from './client';
import type { User } from '@/lib/types';

export default async function AdminUsersPage() {
  const users = await getUsersAction();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          User Management
        </h1>
        <p className="text-muted-foreground">
          View, manage, and moderate all users on the platform.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementClient initialUsers={users} />
        </CardContent>
      </Card>
    </div>
  );
}
