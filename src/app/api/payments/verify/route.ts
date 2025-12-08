import { NextRequest, NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Missing orderId' },
                { status: 400 }
            );
        }

        // Initialize Cashfree
        const cashfree = new Cashfree(
            process.env.CASHFREE_ENVIRONMENT === 'production'
                ? CFEnvironment.PRODUCTION
                : CFEnvironment.SANDBOX,
            process.env.CASHFREE_CLIENT_ID,
            process.env.CASHFREE_CLIENT_SECRET
        );

        // Verify payment status
        const response = await cashfree.PGOrderFetchPayments('2023-08-01', orderId);

        if (!response || !response.data) {
            console.error('Cashfree payment verification failed:', response);
            return NextResponse.json(
                { error: 'Failed to verify payment' },
                { status: 500 }
            );
        }

        // Check if payment was successful
        const payments = response.data;
        const successfulPayment = payments.find((payment: any) =>
            payment.payment_status === 'SUCCESS'
        );

        if (successfulPayment) {
            // Payment was successful - you can process the order here
            // Update user subscription, add coins, etc.

            return NextResponse.json({
                success: true,
                payment_status: 'SUCCESS',
                order_id: orderId,
                payment_id: successfulPayment.cf_payment_id,
                amount: successfulPayment.payment_amount,
            });
        } else {
            return NextResponse.json({
                success: false,
                payment_status: 'FAILED',
                order_id: orderId,
            });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
