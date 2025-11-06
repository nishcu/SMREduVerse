'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { TrendingUp, Coins, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getAdminDb } from '@/lib/firebase-admin';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'earn' | 'spend' | 'transfer';
  amount: number;
  description: string;
  activityType?: string;
  activityTitle?: string;
  createdAt: Date;
}

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
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalSpending: 0,
    totalTransactions: 0,
    platformRevenue: 0,
  });

  useEffect(() => {
    // Fetch transactions from API
    fetch('/api/admin/transactions')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setTransactions(data.transactions || []);
          setStats(data.stats || stats);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching transactions:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          Transaction Reports
        </h1>
        <p className="text-muted-foreground">
          View all knowledge coin transactions and revenue reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Coins earned by users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.totalSpending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Coins spent by users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTransactions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              ₹{stats.platformRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From platform fees</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest knowledge coin transactions on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.type === 'earn' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                      <span className="font-semibold">{transaction.userName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {transaction.description}
                    </p>
                    {transaction.activityType && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Activity: {transaction.activityType} - {transaction.activityTitle}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(transaction.createdAt, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'earn' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {transaction.type === 'earn' ? '+' : '-'}
                    {transaction.amount.toLocaleString()} <Coins className="h-4 w-4 inline" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

