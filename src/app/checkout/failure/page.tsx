'use client';

import { useSearchParams, useRouter } from 'next/navigation';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';
import { XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function CheckoutFailurePage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = searchParams.get('order_id');
    const errorCode = searchParams.get('error_code');
    const errorMessage = searchParams.get('error_message');

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

// Export with SSR disabled
import { default as dynamic } from 'next/dynamic';
export default dynamic(() => Promise.resolve(CheckoutFailurePage), {
    ssr: false,
});
