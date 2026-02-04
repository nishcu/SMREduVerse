'use client';

import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentButtonProps {
    itemType: 'subscription' | 'coins';
    itemId: string;
    amount: number;
    onSuccess: (data: any) => void;
    onFailure: (error: any) => void;
    className?: string;
    children: ReactNode;
}

export function PaymentButton({
    itemType,
    itemId,
    amount,
    onSuccess,
    onFailure,
    className,
    children
}: PaymentButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            // Create payment order
            console.log('Creating payment order for:', { itemType, itemId, amount });
            const response = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemType,
                    itemId,
                    amount,
                }),
            });

            console.log('API Response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error response:', errorText);
                throw new Error(`Failed to create payment order: ${response.status} ${errorText}`);
            }

            const orderData = await response.json();
            console.log('Order data received:', orderData);

            // Initialize Cashfree checkout
            if (typeof window !== 'undefined' && (window as any).Cashfree) {
                const cashfree = (window as any).Cashfree({
                    mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox',
                });

                const checkoutOptions = {
                    paymentSessionId: orderData.payment_session_id,
                    redirectTarget: '_self',
                };

                cashfree.checkout(checkoutOptions).then((result: any) => {
                    if (result.error) {
                        onFailure(result.error);
                    } else if (result.paymentDetails) {
                        onSuccess(result.paymentDetails);
                    }
                });
            } else {
                throw new Error('Cashfree SDK not loaded');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            onFailure(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className={cn(className)}
        >
            {isProcessing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                children
            )}
        </Button>
    );
}
