
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Coins, CircleDollarSign, PlusCircle, Sparkles, BrainCircuit, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useDoc, useCollection } from '@/firebase';
import { useMemo } from 'react';
import { doc, collection, query, orderBy, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Transaction, EconomySettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { getEconomySettingsAction, simulateEarningAction } from './actions';
import { useToast } from '@/hooks/use-toast';

function StatCard({ title, value, icon, isLoading }: { title: string; value: string | number; icon: React.ReactNode; isLoading?: boolean }) {
    return (
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
}

export default function WalletPage() {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [economySettings, setEconomySettings] = useState<EconomySettings | null>(null);

  const userRef = useMemo(() => (user ? doc(db, `users/${user.id}/profile/${user.id}`) : null), [user?.id]);
  const { data: userData, loading: loadingUser } = useDoc<User>(userRef as DocumentReference<User> | null);

  const transactionsQuery = useMemo(() => (user ? query(collection(db, `users/${user.id}/transactions`), orderBy('createdAt', 'desc')) : null), [user?.id]);
  const { data: transactions, loading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

  useEffect(() => {
    async function fetchEconomySettings() {
        const settings = await getEconomySettingsAction();
        if (settings) {
            setEconomySettings(settings);
        }
    }
    fetchEconomySettings();
  }, []);

  const totalEarned = transactions?.filter(t => t.transactionType === 'earn').reduce((acc, t) => acc + t.points, 0) || 0;
  const totalSpent = transactions?.filter(t => t.transactionType === 'spend').reduce((acc, t) => acc + t.points, 0) || 0;
  const currentBalance = userData?.wallet?.knowledgeCoins ?? 0;
  const payoutValue = economySettings ? (currentBalance / economySettings.coinsPerRupee).toFixed(2) : '...';
  
  const isLoading = loadingUser || loadingTransactions || !economySettings;

  const handleSimulateEarning = (points: number, description: string) => {
    if (!firebaseUser) return;

    startTransition(async () => {
        const idToken = await firebaseUser.getIdToken();
        const result = await simulateEarningAction(idToken, points, description);
        if (result.success) {
            toast({
                title: 'Points Earned!',
                description: `You earned ${points} Knowledge Coins.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error,
            });
        }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Wallet className="h-10 w-10 text-primary" />
          <div>
            <h1 className="font-headline text-3xl font-semibold md:text-4xl">
              My Wallet
            </h1>
            <p className="text-muted-foreground">
              Track your Knowledge Coin earnings and spending.
            </p>
          </div>
        </div>
        <Button asChild>
            <Link href="/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Buy More Coins
            </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Earned" value={totalEarned} icon={<TrendingUp />} isLoading={isLoading} />
        <StatCard title="Total Spent" value={Math.abs(totalSpent)} icon={<TrendingDown />} isLoading={isLoading} />
        <StatCard title="Current Balance" value={`${currentBalance} Coins`} icon={<Coins />} isLoading={isLoading} />
        <StatCard title="Estimated Payout Value" value={`₹${payoutValue}`} icon={<CircleDollarSign />} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                A record of your recent transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
               {loadingTransactions ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : transactions && transactions.length > 0 ? (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {transactions.map((txn) => (
                            <TableRow key={txn.id}>
                            <TableCell>
                                <Badge variant={txn.transactionType === 'earn' ? 'default' : 'secondary'} className={cn(txn.transactionType === 'earn' && 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30', txn.transactionType === 'spend' && 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30')}>
                                    {txn.transactionType}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                                {txn.description}
                            </TableCell>
                            <TableCell>{txn.createdAt ? format(txn.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}</TableCell>
                            <TableCell
                                className={cn(
                                'text-right font-semibold flex items-center justify-end gap-1',
                                txn.transactionType === 'earn' ? 'text-green-600' : 'text-destructive'
                                )}
                            >
                                {txn.transactionType === 'earn' ? `+${txn.points}` : `${txn.points}`}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        No transactions yet.
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opportunities to Earn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-md bg-secondary p-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                      <p className="font-semibold text-sm">Daily Challenges</p>
                      <p className="text-xs text-muted-foreground">Up to 50 Coins daily</p>
                  </div>
              </div>
              <div className="flex items-center gap-3 rounded-md bg-secondary p-3">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  <div>
                      <p className="font-semibold text-sm">Complete a Course</p>
                      <p className="text-xs text-muted-foreground">From 100 to 500 Coins</p>
                  </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Simulate Earning Points</CardTitle>
              <CardDescription>Test the system by adding points to your wallet.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <Button onClick={() => handleSimulateEarning(10, "Completed a Quiz")} disabled={isPending}>Earn 10 Points</Button>
                <Button onClick={() => handleSimulateEarning(50, "Won a Mini-Game")} disabled={isPending}>Earn 50 Points</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
