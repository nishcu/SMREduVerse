'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Trophy, Coins, TrendingUp, DollarSign, Activity, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalChallenges: number;
  totalContests: number;
  totalTransactions: number;
  totalRevenue: number;
  activeUsers: number;
  totalKnowledgeCoins: number;
}

function StatCard({ title, value, icon, description, isLoading }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          {description && <Skeleton className="h-4 w-32 mt-2" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalChallenges: 0,
    totalContests: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalKnowledgeCoins: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from API route
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setStats(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of platform statistics and key metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="All registered users"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description="Active in last 30 days"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses.toLocaleString()}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
          description="All courses on platform"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Challenges"
          value={stats.totalChallenges.toLocaleString()}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          description="Active and completed"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Contests"
          value={stats.totalContests.toLocaleString()}
          icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
          description="All contests"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions.toLocaleString()}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Knowledge coin transactions"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="From platform fees"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Knowledge Coins"
          value={stats.totalKnowledgeCoins.toLocaleString()}
          icon={<Coins className="h-4 w-4 text-muted-foreground" />}
          description="In circulation"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/super-admin/users" className="block p-3 border rounded-lg hover:bg-secondary transition-colors">
              <div className="font-semibold">Manage Users</div>
              <div className="text-sm text-muted-foreground">View and manage all users</div>
            </a>
            <a href="/super-admin/challenges" className="block p-3 border rounded-lg hover:bg-secondary transition-colors">
              <div className="font-semibold">Manage Challenges</div>
              <div className="text-sm text-muted-foreground">View and moderate challenges</div>
            </a>
            <a href="/super-admin/courses" className="block p-3 border rounded-lg hover:bg-secondary transition-colors">
              <div className="font-semibold">Manage Courses</div>
              <div className="text-sm text-muted-foreground">Review and approve courses</div>
            </a>
            <a href="/super-admin/reports" className="block p-3 border rounded-lg hover:bg-secondary transition-colors">
              <div className="font-semibold">Transaction Reports</div>
              <div className="text-sm text-muted-foreground">View all transactions</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Activity feed coming soon...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

