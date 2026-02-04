'use client';
import { useState } from 'react';
import type { SubscriptionPlan } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { PaymentButton } from './cashfree-checkout';

interface SubscriptionPlanCardProps {
    plan: SubscriptionPlan;
}

export function SubscriptionPlanCard({ plan }: SubscriptionPlanCardProps) {
    const { toast } = useToast();

    const handlePaymentSuccess = () => {
        toast({
            title: 'Subscription Activated!',
            description: `Welcome to the ${plan.name} plan. Your subscription is now active.`,
        });
    };

    const handlePaymentFailure = () => {
        toast({
            variant: 'destructive',
            title: 'Subscription Failed',
            description: 'Your subscription could not be processed. Please try again.',
        });
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
                <PaymentButton
                    itemType="subscription"
                    itemId={plan.id}
                    amount={parseFloat(plan.price.replace(/[^0-9.]/g, ''))}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                    className="w-full"
                >
                    Choose Plan
                </PaymentButton>
            </CardFooter>
        </Card>
    );
}
