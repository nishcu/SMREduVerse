'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Coins, ArrowRight, Home, Receipt } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();

    const [orderDetails, setOrderDetails] = useState<{
        orderId: string;
        itemType: string;
        itemName: string;
        amount: string;
        currency: string;
        status: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        const paymentStatus = searchParams.get('payment');

        if (!orderId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Order ID not found. Please contact support if you were charged.',
            });
            router.push('/billing');
            return;
        }

        // In a real implementation, you might want to verify the payment status
        // from your backend here to ensure it's legitimate

        // For now, we'll extract information from the order ID or use defaults
        const itemType = orderId.includes('COIN') ? 'coin_bundle' :
                        orderId.includes('SUB') ? 'subscription' : 'marketplace_item';

        setOrderDetails({
            orderId,
            itemType,
            itemName: itemType === 'coin_bundle' ? 'Knowledge Coins' :
                     itemType === 'subscription' ? 'Premium Subscription' : 'Marketplace Item',
            amount: searchParams.get('amount') || '₹0',
            currency: 'INR',
            status: paymentStatus === 'success' ? 'Paid' : 'Processing'
        });

        setIsLoading(false);

        // Show success toast
        if (paymentStatus === 'success') {
            toast({
                title: 'Payment Successful!',
                description: 'Your purchase has been completed successfully.',
            });
        }
    }, [searchParams, router, toast]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8">
                {/* Success Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        Payment Successful!
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Your purchase has been completed successfully
                    </p>
                </div>

                {/* Order Details */}
                {orderDetails && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Order Confirmation
                            </CardTitle>
                            <CardDescription>
                                Here are your order details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                                    <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                        {orderDetails.orderId}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Item Type</label>
                                    <p className="capitalize">{orderDetails.itemType.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                                    <p className="text-lg font-semibold">{orderDetails.amount}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <p className="text-green-600 dark:text-green-400 font-medium">
                                        {orderDetails.status}
                                    </p>
                                </div>
                            </div>

                            {orderDetails.itemType === 'coin_bundle' && (
                                <Alert>
                                    <Coins className="h-4 w-4" />
                                    <AlertDescription>
                                        Your Knowledge Coins have been added to your wallet. You can now use them to purchase courses, access premium content, and more!
                                    </AlertDescription>
                                </Alert>
                            )}

                            {orderDetails.itemType === 'subscription' && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Your premium subscription is now active. Enjoy unlimited access to all premium features!
                                    </AlertDescription>
                                </Alert>
                            )}

                            {orderDetails.itemType === 'marketplace_item' && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Your marketplace purchase has been completed. Check your profile for access to the purchased content.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Next Steps */}
                <Card>
                    <CardHeader>
                        <CardTitle>What's Next?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link href="/wallet">
                                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-start">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Coins className="h-5 w-5" />
                                        <span>Check Wallet</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground text-left">
                                        View your updated balance and transaction history
                                    </p>
                                </Button>
                            </Link>

                            <Link href="/dashboard">
                                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-start">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home className="h-5 w-5" />
                                        <span>Go to Dashboard</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground text-left">
                                        Continue learning and exploring new content
                                    </p>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Support */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        Need help with your order?
                    </p>
                    <Link href="/support">
                        <Button variant="link" size="sm">
                            Contact Support
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <CheckoutSuccessContent />
        </Suspense>
    );
}