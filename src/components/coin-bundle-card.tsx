
'use client';
import { useState } from 'react';
import type { CoinBundle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coins, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { PaymentButton } from './cashfree-checkout';
import { useRouter } from 'next/navigation';

interface CoinBundleCardProps {
    bundle: CoinBundle;
}

export function CoinBundleCard({ bundle }: CoinBundleCardProps) {
    const { toast } = useToast();
    const router = useRouter();

    const handlePaymentSuccess = () => {
        toast({
            title: 'Purchase Successful!',
            description: `You've added ${bundle.coins} Knowledge Coins to your wallet.`,
        });
        // Refresh the page to update wallet balance
        router.refresh();
    };

    const handlePaymentFailure = () => {
        toast({
            variant: 'destructive',
            title: 'Purchase Failed',
            description: 'Payment was not completed. Please try again.',
        });
    };

    return (
        <Card className={cn("flex flex-col", bundle.isPopular && "border-primary border-2 relative")}>
            {bundle.isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Most Popular
                </Badge>
            )}
            <CardHeader className="items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-500">
                    <Coins className="h-8 w-8" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow text-center">
                <CardTitle className="text-3xl font-bold">{bundle.coins.toLocaleString()}</CardTitle>
                <CardDescription>Knowledge Coins</CardDescription>
            </CardContent>
            <CardFooter>
                <PaymentButton
                    itemType="coin_bundle"
                    itemId={bundle.id}
                    amount={parseFloat(bundle.price.replace('₹', ''))}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                >
                    Buy at {bundle.price}
                </PaymentButton>
            </CardFooter>
        </Card>
    );
}
