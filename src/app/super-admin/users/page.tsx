'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UserManagementClient } from './client';
import { useEffect, useState } from "react";
import type { User } from '@/lib/types';
import { getUsersAction } from './actions';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const usersData = await getUsersAction();
      setUsers(usersData);
      setIsLoading(false);
    }
    fetchUsers();
  }, []);

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
          <UserManagementClient initialUsers={users} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
