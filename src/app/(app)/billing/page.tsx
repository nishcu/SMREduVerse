'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSubscriptionPlansAction, getCoinBundlesAction } from './actions';
import type { SubscriptionPlan, CoinBundle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionPlanCard } from '@/components/subscription-plan-card';
import { CoinBundleCard } from '@/components/coin-bundle-card';
import { CreditCard, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [bundles, setBundles] = useState<CoinBundle[]>([]);
    const [isPending, setIsPending] = useState(true);
    const searchParams = useSearchParams();
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            setIsPending(true);
            const [plansResult, bundlesResult] = await Promise.all([
                getSubscriptionPlansAction(),
                getCoinBundlesAction(),
            ]);

            if (plansResult.success && plansResult.data) {
                setPlans(plansResult.data);
            }
            if (bundlesResult.success && bundlesResult.data) {
                setBundles(bundlesResult.data);
            }

            setIsPending(false);
        };
        loadData();
    }, []);

    // Handle payment status from Cashfree redirect
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const orderId = searchParams.get('order_id');

        if (paymentStatus === 'success') {
            toast({
                title: 'Payment Successful!',
                description: 'Your purchase has been completed successfully.',
            });
        } else if (paymentStatus === 'failure') {
            toast({
                variant: 'destructive',
                title: 'Payment Failed',
                description: 'Your payment could not be processed. Please try again.',
            });
        }
    }, [searchParams, toast]);

    return (
        <div className="space-y-12">
            <div>
                <h1 className="font-headline text-3xl font-semibold md:text-4xl">Billing & Subscriptions</h1>
                <p className="text-muted-foreground">Upgrade your plan or purchase more Knowledge Coins.</p>
            </div>

            <div className="space-y-6">
                <h2 className="font-headline text-2xl font-semibold flex items-center gap-2">
                    <CreditCard className="h-6 w-6 text-primary" />
                    Subscription Plans
                </h2>
                {isPending && plans.length === 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Skeleton className="h-[400px] w-full" />
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        {plans.map(plan => <SubscriptionPlanCard key={plan.id} plan={plan} />)}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                 <h2 className="font-headline text-2xl font-semibold flex items-center gap-2">
                    <Coins className="h-6 w-6 text-primary" />
                    Purchase Knowledge Coins
                </h2>
                {isPending && bundles.length === 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[200px] w-full" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {bundles.map(bundle => <CoinBundleCard key={bundle.id} bundle={bundle} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
