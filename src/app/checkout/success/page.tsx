'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);
    const [verificationResult, setVerificationResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const orderId = searchParams.get('order_id');

    useEffect(() => {
        if (orderId) {
            verifyPayment();
        }
    }, [orderId]);

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

// Export with SSR disabled
import { default as dynamic } from 'next/dynamic';
export default dynamic(() => Promise.resolve(CheckoutSuccessPage), {
    ssr: false,
});
