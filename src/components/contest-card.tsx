'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Coins, Zap } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Contest } from '@/lib/types';

export function ContestCard({ contest }: { contest: Contest }) {
  const isLive = contest.status === 'live';
  const isUpcoming = contest.status === 'upcoming';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="font-headline text-xl">{contest.title}</CardTitle>
          {isLive ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Zap className="h-4 w-4 animate-pulse" />
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="capitalize">{contest.status}</Badge>
          )}
        </div>
        <CardDescription>{contest.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between rounded-lg bg-secondary p-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Prize</p>
            <p className="font-bold text-lg flex items-center gap-1"><Coins className="h-4 w-4 text-amber-500"/>{contest.prize}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Entry Fee</p>
            <p className="font-bold text-lg">{contest.entryFee} Coins</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{isUpcoming ? 'Starts' : 'Ends'}</p>
            <p className="font-bold text-lg">{format(new Date(isUpcoming ? contest.startDate : contest.endDate), 'PP')}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/leaderboard">
            View Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
