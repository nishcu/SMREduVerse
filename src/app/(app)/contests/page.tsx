
'use client';

import { Trophy } from 'lucide-react';
import { getContestsAction } from '@/app/super-admin/contests/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContestCard } from '@/components/contest-card';
import type { Contest } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContestsPage() {
    const [contests, setContests] = useState<Contest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContests = async () => {
            setIsLoading(true);
            const contestsData = await getContestsAction();
            setContests(contestsData as Contest[]);
            setIsLoading(false);
        };
        fetchContests();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Trophy className="h-10 w-10 text-primary" />
                <div>
                <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                    Contests
                </h1>
                <p className="text-muted-foreground">
                    Compete in challenges and win knowledge coins.
                </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="font-headline text-2xl font-semibold">Current & Upcoming</h2>
                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : contests && contests.length > 0 ? (
                        contests.map((contest) => (
                            <ContestCard key={contest.id} contest={contest} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-16 text-center">
                            <Trophy className="h-16 w-16 text-muted-foreground/50" />
                            <h3 className="mt-4 text-2xl font-semibold">No Contests Available</h3>
                            <p className="mt-2 text-muted-foreground">No contests are running right now. Check back soon!</p>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>How Contests Work</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                             <p>
                                <strong>Join:</strong> Pay the entry fee in Knowledge Coins to join a contest.
                            </p>
                            <p>
                                <strong>Compete:</strong> Complete the contest objective. This could be earning points in games, completing courses, or other activities.
                            </p>
                             <p>
                                <strong>Win:</strong> Top performers on the leaderboard at the end of the contest win the grand prize!
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
