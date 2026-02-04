import { NextRequest, NextResponse } from 'next/server';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
// import { getAdminDb } from '@/lib/firebase-admin'; // Temporarily disabled for testing

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-webhook-signature');

        if (!signature) {
            return NextResponse.json(
                { error: 'Missing webhook signature' },
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

        // Verify webhook signature (DISABLED FOR TESTING)
        // const timestamp = request.headers.get('x-webhook-timestamp');
        // const isValidSignature = cashfree.PGVerifyWebhookSignature(
        //     signature,
        //     body,
        //     timestamp || ''
        // );

        // if (!isValidSignature) {
        //     return NextResponse.json(
        //         { error: 'Invalid webhook signature' },
        //         { status: 400 }
        //     );
        // }

        console.log('⚠️ Webhook signature verification DISABLED for testing');

        const webhookData = JSON.parse(body);

        console.log('Received Cashfree webhook:', webhookData);

        // Handle different webhook events
        if (webhookData.type === 'PAYMENT_SUCCESS_WEBHOOK') {
            await handlePaymentSuccess(webhookData.data);
        } else if (webhookData.type === 'PAYMENT_FAILED_WEBHOOK') {
            await handlePaymentFailure(webhookData.data);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function handlePaymentSuccess(paymentData: any) {
    // const db = getAdminDb(); // Temporarily disabled

    try {
        const { order_id, payment_amount, customer_details, order_meta } = paymentData;

        // Extract item information from order tags or meta
        const itemType = order_meta?.item_type || 'unknown';
        const itemId = order_meta?.item_id || 'unknown';

        // Process based on item type
        if (itemType === 'subscription') {
            // Handle subscription activation
            // You would typically:
            // 1. Update user's subscription status in database
            // 2. Set subscription expiry date
            // 3. Send confirmation email

            console.log(`Activating subscription ${itemId} for user ${customer_details.customer_id}`);

        } else if (itemType === 'coins') {
            // Handle coin purchase
            // You would typically:
            // 1. Add coins to user's wallet
            // 2. Create transaction record

            console.log(`Adding coins for purchase ${itemId} to user ${customer_details.customer_id}`);
        }

        // Log successful payment
        // await db.collection('payment_logs').add({ // Temporarily disabled
        //     order_id,
        //     payment_amount,
        //     status: 'success',
        //     item_type: itemType,
        //     item_id: itemId,
        //     customer_id: customer_details.customer_id,
        //     created_at: new Date(),
        // });

    } catch (error) {
        console.error('Error handling payment success:', error);
    }
}

async function handlePaymentFailure(paymentData: any) {
    // const db = getAdminDb(); // Temporarily disabled

    try {
        const { order_id, payment_amount, customer_details } = paymentData;

        // Log failed payment
        // await db.collection('payment_logs').add({ // Temporarily disabled
        //     order_id,
        //     payment_amount,
        //     status: 'failed',
        //     customer_id: customer_details.customer_id,
        //     created_at: new Date(),
        // });

        console.log(`Payment failed for order ${order_id}`);

    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
}
