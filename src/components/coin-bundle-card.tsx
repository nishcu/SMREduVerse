
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
import { useCashfree } from '@/hooks/use-cashfree';
import { initiateCoinBundleCheckoutAction, confirmCashfreePaymentAction } from '@/app/(app)/billing/actions';

interface CoinBundleCardProps {
    bundle: CoinBundle;
}

export function CoinBundleCard({ bundle }: CoinBundleCardProps) {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { toast } = useToast();
    const { firebaseUser } = useAuth();
    const { openCheckout, error: cashfreeError, isReady } = useCashfree();

    const handlePurchase = async () => {
        if (!firebaseUser) {
            toast({
                variant: 'destructive',
                title: 'Sign in required',
                description: 'Please login to purchase Knowledge Coins.',
            });
            return;
        }

        if (cashfreeError) {
            toast({
                variant: 'destructive',
                title: 'Payment unavailable',
                description: cashfreeError,
            });
            return;
        }

        if (!isReady) {
            toast({
                title: 'Please wait',
                description: 'Payment gateway is still loading. Try again shortly.',
            });
            return;
        }

        setIsPurchasing(true);
        try {
            const idToken = await firebaseUser.getIdToken();
            const checkout = await initiateCoinBundleCheckoutAction({ idToken, bundleId: bundle.id });

            if (!checkout.success || !checkout.paymentSessionId || !checkout.orderId) {
                throw new Error(checkout.error || 'Unable to start payment. Please try again.');
            }

            await openCheckout(checkout.paymentSessionId);
            const confirmation = await confirmCashfreePaymentAction({ idToken, orderId: checkout.orderId });

            if (!confirmation.success) {
                throw new Error(confirmation.error || 'Payment confirmation failed.');
            }

            toast({
                title: 'Purchase Successful!',
                description: `You've added ${bundle.coins} Knowledge Coins to your wallet.`,
            });
        } catch (error: any) {
            const description = error?.message || 'Payment was cancelled or failed. Please try again.';
            toast({
                variant: 'destructive',
                title: 'Payment failed',
                description,
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
                <Button className="w-full" onClick={handlePurchase} disabled={isPurchasing}>
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
