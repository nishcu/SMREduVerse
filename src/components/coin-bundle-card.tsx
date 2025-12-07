
'use client';
import { useState } from 'react';
import type { CoinBundle } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useCashfreeCheckout } from '@/hooks/use-cashfree-checkout';

interface CoinBundleCardProps {
    bundle: CoinBundle;
}

export function CoinBundleCard({ bundle }: CoinBundleCardProps) {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { toast } = useToast();
    const { firebaseUser } = useAuth();
    const { startPayment, sdkReady } = useCashfreeCheckout();

    const handlePurchase = async () => {
        if (!firebaseUser) {
            toast({
                variant: 'destructive',
                title: 'Sign in required',
                description: 'Please log in to purchase coins.',
            });
            return;
        }

        setIsPurchasing(true);
        try {
            const idToken = await firebaseUser.getIdToken();
            const result = await startPayment({
                itemId: bundle.id,
                itemType: 'coin_bundle',
                idToken,
            });

            const newBalance = result?.applyResult?.newBalance;

            toast({
                title: 'Coins Added!',
                description: newBalance
                    ? `You've added ${bundle.coins.toLocaleString()} Knowledge Coins. New balance: ${newBalance.toLocaleString()}`
                    : `You've added ${bundle.coins.toLocaleString()} Knowledge Coins to your wallet.`,
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Purchase failed',
                description: error?.message || 'Unable to process payment.',
            });
        } finally {
            setIsPurchasing(false);
        }
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
                <Button className="w-full" onClick={handlePurchase} disabled={isPurchasing || !sdkReady}>
                    {isPurchasing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        `Buy at ${bundle.price}`
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
