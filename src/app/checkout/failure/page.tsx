'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, RefreshCw, ArrowLeft, HelpCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

function CheckoutFailureContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const [failureReason, setFailureReason] = useState<string>('Unknown error');
    const [orderId, setOrderId] = useState<string>('');

    useEffect(() => {
        const orderIdParam = searchParams.get('order_id');
        const errorCode = searchParams.get('error_code');
        const errorMessage = searchParams.get('error_message');

        if (orderIdParam) {
            setOrderId(orderIdParam);
        }

        // Determine failure reason based on error code or message
        if (errorCode === 'PAYMENT_DECLINED') {
            setFailureReason('Your payment was declined by the bank. Please check your card details or try a different payment method.');
        } else if (errorCode === 'INSUFFICIENT_FUNDS') {
            setFailureReason('Insufficient funds in your account. Please check your balance or use a different payment method.');
        } else if (errorCode === 'CARD_EXPIRED') {
            setFailureReason('Your card has expired. Please use a different card or payment method.');
        } else if (errorCode === 'OTP_FAILED') {
            setFailureReason('OTP verification failed. Please try again with the correct OTP.');
        } else if (errorMessage) {
            setFailureReason(errorMessage);
        } else {
            setFailureReason('Your payment could not be processed. Please try again or contact support if the problem persists.');
        }

        // Show failure toast
        toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: 'Your payment could not be processed. Please try again.',
        });
    }, [searchParams, toast]);

    const handleRetryPayment = () => {
        // Redirect back to billing page to try again
        router.push('/billing');
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-2xl w-full space-y-8">
                {/* Failure Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-red-100 dark:bg-red-900 p-3">
                            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                        Payment Failed
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        We couldn't process your payment
                    </p>
                </div>

                {/* Error Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5" />
                            What went wrong?
                        </CardTitle>
                        <CardDescription>
                            Here's why your payment failed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {orderId && (
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                    {orderId}
                                </p>
                            </div>
                        )}

                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                                {failureReason}
                            </AlertDescription>
                        </Alert>

                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-medium mb-2">Common Payment Issues:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Insufficient funds in your account</li>
                                <li>• Card details entered incorrectly</li>
                                <li>• Card expired or blocked</li>
                                <li>• Network connectivity issues</li>
                                <li>• Bank security restrictions</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                    <CardHeader>
                        <CardTitle>What would you like to do?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={handleRetryPayment}
                                className="w-full h-auto p-4 flex flex-col items-start"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <RefreshCw className="h-5 w-5" />
                                    <span>Try Again</span>
                                </div>
                                <p className="text-sm text-muted-foreground text-left">
                                    Retry your payment with the same or different payment method
                                </p>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleGoBack}
                                className="w-full h-auto p-4 flex flex-col items-start"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowLeft className="h-5 w-5" />
                                    <span>Go Back</span>
                                </div>
                                <p className="text-sm text-muted-foreground text-left">
                                    Return to the previous page to review your selection
                                </p>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Alternative Payment Methods
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="flex flex-col items-center p-4 border rounded-lg">
                                <div className="text-2xl mb-2">💳</div>
                                <span className="text-sm font-medium">Credit Card</span>
                            </div>
                            <div className="flex flex-col items-center p-4 border rounded-lg">
                                <div className="text-2xl mb-2">💳</div>
                                <span className="text-sm font-medium">Debit Card</span>
                            </div>
                            <div className="flex flex-col items-center p-4 border rounded-lg">
                                <div className="text-2xl mb-2">📱</div>
                                <span className="text-sm font-medium">UPI</span>
                            </div>
                            <div className="flex flex-col items-center p-4 border rounded-lg">
                                <div className="text-2xl mb-2">🏦</div>
                                <span className="text-sm font-medium">Net Banking</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Support */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        Still having trouble? We're here to help.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/support">
                            <Button variant="link" size="sm">
                                Contact Support
                                <HelpCircle className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/billing">
                            <Button variant="link" size="sm">
                                Back to Billing
                                <ArrowLeft className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutFailurePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <CheckoutFailureContent />
        </Suspense>
    );
}