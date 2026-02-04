
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { mockRewards, type Reward } from '@/lib/data';
import { Gift, Ticket, BookOpen as Book, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';


const iconMap = {
    'Course Coupon': <Ticket />,
    'eBook': <Book />,
    'Profile Badge': <Gift />,
};

export default function RewardsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [rewards, setRewards] = useState<Reward[]>(mockRewards);

    const handleRedeem = (rewardId: string) => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Logged In',
                description: 'You must be logged in to redeem rewards.',
            });
            return;
        }

        const reward = rewards.find(r => r.id === rewardId);
        if (!reward) return;

        // In a real app, this would call a server action.
        // The server action would handle the transaction to ensure the user has enough points,
        // decrement points, decrement inventory, and grant the reward.
        
        // For now, we simulate success and update the client-side state.
        if (reward.inventory > 0) {
            setRewards(prevRewards =>
                prevRewards.map(r =>
                    r.id === rewardId ? { ...r, inventory: r.inventory - 1 } : r
                )
            );
            toast({
                title: 'Reward Redeemed!',
                description: `You have successfully redeemed "${reward.title}".`,
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Out of Stock',
                description: 'This reward is no longer available.',
            });
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Gift className="h-10 w-10 text-primary" />
                    <div>
                    <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                        Rewards Store
                    </h1>
                    <p className="text-muted-foreground">
                        Redeem your Knowledge Coins for exclusive digital goods.
                    </p>
                    </div>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/referrals">View Referrals & Coupons</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rewards.map(reward => (
                    <Card key={reward.id} className={cn("flex flex-col", reward.inventory === 0 && 'opacity-60')}>
                        <CardHeader className="flex-row items-start gap-4 space-y-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                {iconMap[reward.type as keyof typeof iconMap] || <Gift />}
                            </div>
                            <div className="flex-1">
                                <CardTitle>{reward.title}</CardTitle>
                                <CardDescription>{reward.type}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground">{reward.description}</p>
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-4">
                            <div className="text-sm font-medium text-muted-foreground">{reward.inventory} left in stock</div>
                            <Button className="w-full" onClick={() => handleRedeem(reward.id)} disabled={reward.inventory === 0}>
                                <Coins className="mr-2 h-4 w-4" />
                                Redeem for {reward.pointsRequired} Points
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
