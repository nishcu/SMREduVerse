'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { CheckCircle, Loader2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckoutDynamicPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);
    const [verificationResult, setVerificationResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const slug = params.slug as string[];
    const isSuccess = slug && slug[0] === 'success';
    const isFailure = slug && slug[0] === 'failure';

    const orderId = searchParams.get('order_id');
    const errorCode = searchParams.get('error_code');
    const errorMessage = searchParams.get('error_message');

    useEffect(() => {
        if (isSuccess && orderId) {
            verifyPayment();
        } else if (isFailure) {
            setIsVerifying(false);
        }
    }, [isSuccess, isFailure, orderId]);

    const verifyPayment = async () => {
        try {
            const response = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            });

            const result = await response.json();

            if (result.success) {
                setVerificationResult({
                    success: true,
                    message: 'Payment verified successfully! Your purchase has been processed.',
                });
            } else {
                setVerificationResult({
                    success: false,
                    message: 'Payment verification failed. Please contact support if you were charged.',
                });
            }
        } catch (error) {
            setVerificationResult({
                success: false,
                message: 'Unable to verify payment. Please check your email for confirmation.',
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const getErrorMessage = () => {
        if (errorMessage) return errorMessage;

        switch (errorCode) {
            case 'PAYMENT_CANCELLED':
                return 'Payment was cancelled by the user.';
            case 'PAYMENT_FAILED':
                return 'Payment failed. Please check your payment method and try again.';
            case 'INVALID_REQUEST':
                return 'Invalid payment request. Please try again.';
            default:
                return 'Payment could not be processed. Please try again or contact support.';
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        {isVerifying ? (
                            <div className="flex flex-col items-center space-y-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <CardTitle className="text-xl">Verifying Payment...</CardTitle>
                            </div>
                        ) : verificationResult?.success ? (
                            <div className="flex flex-col items-center space-y-4">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                                <CardTitle className="text-xl text-green-600">Payment Successful!</CardTitle>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-500 text-2xl">✗</span>
                                </div>
                                <CardTitle className="text-xl text-red-600">Payment Issue</CardTitle>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        {verificationResult && (
                            <p className="text-muted-foreground">
                                {verificationResult.message}
                            </p>
                        )}

                        {orderId && (
                            <p className="text-sm text-muted-foreground">
                                Order ID: {orderId}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={() => router.push('/billing')}
                                className="flex-1"
                            >
                                Back to Billing
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                                className="flex-1"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isFailure) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex flex-col items-center space-y-4">
                            <XCircle className="h-12 w-12 text-red-500" />
                            <CardTitle className="text-xl text-red-600">Payment Failed</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-muted-foreground">
                            {getErrorMessage()}
                        </p>

                        {orderId && (
                            <p className="text-sm text-muted-foreground">
                                Order ID: {orderId}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={() => router.push('/billing')}
                                className="flex-1"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/support')}
                                className="flex-1"
                            >
                                Contact Support
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>If you were charged, the amount will be refunded within 5-7 business days.</p>
                            <p>For immediate assistance, contact us at support@smreduverse.com</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Page Not Found</h1>
                <p className="text-muted-foreground">The checkout page you're looking for doesn't exist.</p>
            </div>
        </div>
    );
}
