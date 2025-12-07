'use client';
import { useState } from 'react';
import type { SubscriptionPlan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useCashfree } from '@/hooks/use-cashfree';
import { initiateSubscriptionCheckoutAction, confirmCashfreePaymentAction } from '@/app/(app)/billing/actions';

interface SubscriptionPlanCardProps {
    plan: SubscriptionPlan;
}

export function SubscriptionPlanCard({ plan }: SubscriptionPlanCardProps) {
    const [isUpgrading, setIsUpgrading] = useState(false);
    const { toast } = useToast();
    const { firebaseUser } = useAuth();
    const { openCheckout, error: cashfreeError, isReady } = useCashfree();

    const handleUpgrade = async () => {
        if (!firebaseUser) {
            toast({
                variant: 'destructive',
                title: 'Sign in required',
                description: 'Please login to upgrade your subscription.',
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
                description: 'Payment gateway is still loading. Try again in a second.',
            });
            return;
        }

        setIsUpgrading(true);
        try {
            const idToken = await firebaseUser.getIdToken();
            const checkout = await initiateSubscriptionCheckoutAction({ idToken, planId: plan.id });

            if (!checkout.success || !checkout.paymentSessionId || !checkout.orderId) {
                throw new Error(checkout.error || 'Unable to start payment. Please try again.');
            }

            await openCheckout(checkout.paymentSessionId);
            const confirmation = await confirmCashfreePaymentAction({ idToken, orderId: checkout.orderId });

            if (!confirmation.success) {
                throw new Error(confirmation.error || 'Payment confirmation failed.');
            }

            toast({
                title: 'Upgrade Successful!',
                description: `You are now subscribed to the ${plan.name} plan.`,
            });
        } catch (error: any) {
            const description = error?.message || 'Payment was cancelled or failed. Please try again.';
            toast({
                variant: 'destructive',
                title: 'Payment failed',
                description,
            });
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <Card className={cn("flex flex-col", plan.isPopular && "border-primary border-2 relative")}>
             {plan.isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Best Value
                </Badge>
            )}
            <CardHeader>
                <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                <div>
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.pricePeriod}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                <p className="font-semibold">What's included:</p>
                <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={isUpgrading}>
                    {isUpgrading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Upgrading...
                        </>
                    ) : (
                        'Choose Plan'
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
