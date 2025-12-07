'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';

declare global {
    interface Window {
        Cashfree: any;
    }
}

interface CashfreeCheckoutProps {
    orderToken: string;
    orderId: string;
    onSuccess?: (data: any) => void;
    onFailure?: (data: any) => void;
    children?: React.ReactNode;
}

export function CashfreeCheckout({
    orderToken,
    orderId,
    onSuccess,
    onFailure,
    children
}: CashfreeCheckoutProps) {
    const { firebaseUser } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // Load Cashfree SDK script
    useEffect(() => {
        if (window.Cashfree) {
            setIsScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.onload = () => setIsScriptLoaded(true);
        script.onerror = () => {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load payment system. Please try again.',
            });
        };
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [toast]);

    const handlePayment = async () => {
        if (!firebaseUser || !isScriptLoaded) return;

        setIsLoading(true);

        try {
            const cashfree = new window.Cashfree();

            const checkoutOptions = {
                paymentSessionId: orderToken, // This should be the payment_session_id from the order
                redirectTarget: "_modal", // or "_self" for same window
            };

            cashfree.checkout(checkoutOptions).then((result: any) => {
                if (result.error) {
                    console.error('Payment failed:', result.error);
                    toast({
                        variant: 'destructive',
                        title: 'Payment Failed',
                        description: result.error.message || 'Payment was not completed successfully.',
                    });
                    onFailure?.(result);
                } else if (result.paymentDetails) {
                    console.log('Payment successful:', result.paymentDetails);
                    toast({
                        title: 'Payment Successful!',
                        description: 'Your payment has been processed successfully.',
                    });
                    onSuccess?.(result);
                }
                setIsLoading(false);
            });

        } catch (error) {
            console.error('Payment error:', error);
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: 'An error occurred while processing your payment.',
            });
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handlePayment}
            disabled={!isScriptLoaded || isLoading}
            className="w-full"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                </>
            ) : (
                <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {children || 'Pay Now'}
                </>
            )}
        </Button>
    );
}

interface PaymentButtonProps {
    itemType: 'coin_bundle' | 'subscription' | 'course' | 'marketplace_item';
    itemId: string;
    amount: number;
    currency?: string;
    children?: React.ReactNode;
    onSuccess?: () => void;
    onFailure?: () => void;
}

export function PaymentButton({
    itemType,
    itemId,
    amount,
    currency = 'INR',
    children,
    onSuccess,
    onFailure
}: PaymentButtonProps) {
    const { firebaseUser } = useAuth();
    const { toast } = useToast();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [orderData, setOrderData] = useState<{
        orderId: string;
        orderToken: string;
        paymentId: string;
    } | null>(null);

    const createOrder = async () => {
        if (!firebaseUser) return;

        setIsCreatingOrder(true);

        try {
            const idToken = await firebaseUser.getIdToken();

            const response = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    itemType,
                    itemId,
                    amount: amount.toString(),
                    currency,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create payment order');
            }

            setOrderData(result.data);

        } catch (error) {
            console.error('Error creating order:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to initiate payment. Please try again.',
            });
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handlePaymentSuccess = async (data: any) => {
        // Verify payment with backend
        try {
            const idToken = await firebaseUser!.getIdToken();

            const response = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    orderId: orderData?.orderId,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                onSuccess?.();
            } else {
                throw new Error('Payment verification failed');
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            toast({
                variant: 'destructive',
                title: 'Verification Error',
                description: 'Payment was processed but verification failed. Please contact support.',
            });
        }
    };

    const handlePaymentFailure = (data: any) => {
        onFailure?.();
    };

    if (orderData) {
        return (
            <CashfreeCheckout
                orderToken={orderData.orderToken}
                orderId={orderData.orderId}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
            >
                {children || `Pay ₹${amount}`}
            </CashfreeCheckout>
        );
    }

    return (
        <Button
            onClick={createOrder}
            disabled={isCreatingOrder}
            className="w-full"
        >
            {isCreatingOrder ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Order...
                </>
            ) : (
                <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {children || `Pay ₹${amount}`}
                </>
            )}
        </Button>
    );
}
