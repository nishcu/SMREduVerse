import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import CashfreeService from '@/lib/cashfree';
import { awardCoins } from '@/lib/coin-transactions';

const WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-cashfree-signature');

        // Verify webhook signature
        if (WEBHOOK_SECRET && signature) {
            const isValidSignature = CashfreeService.verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
            if (!isValidSignature) {
                console.error('Invalid webhook signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const payload = JSON.parse(body);
        const { orderId, orderStatus, paymentDetails } = payload.data;

        console.log('Received Cashfree webhook:', { orderId, orderStatus });

        // Find the payment order in Firestore
        const db = getAdminDb();
        const paymentQuery = await db
            .collection('payments')
            .where('orderId', '==', orderId)
            .limit(1)
            .get();

        if (paymentQuery.empty) {
            console.error('Payment order not found for orderId:', orderId);
            return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
        }

        const paymentDoc = paymentQuery.docs[0];
        const paymentData = paymentDoc.data();

        // Update payment status
        const updateData: any = {
            status: orderStatus,
            updatedAt: new Date(),
        };

        if (paymentDetails?.paymentId) {
            updateData.transactionId = paymentDetails.paymentId;
        }

        // If payment is successful and not already processed
        if (orderStatus === 'PAID' && paymentData.status !== 'SUCCESS') {
            const userId = paymentData.userId;

            // Process the payment based on item type
            if (paymentData.itemType === 'coin_bundle') {
                // Add coins to user's wallet
                const bundleId = paymentData.itemId;
                const bundleDoc = await db.collection('app-settings/monetization/coin-bundles').doc(bundleId).get();

                if (bundleDoc.exists) {
                    const bundleData = bundleDoc.data();
                    const coinsToAdd = bundleData?.coins || 0;

                    // Add coins using the coin transaction utility
                    await awardCoins(userId, coinsToAdd, `Purchased ${coinsToAdd} Knowledge Coins`);
                }
            } else if (paymentData.itemType === 'marketplace_item') {
                // Record marketplace purchase
                const productId = paymentData.itemId;
                const productDoc = await db.collection('marketplace-products').doc(productId).get();

                if (productDoc.exists) {
                    const productData = productDoc.data();

                    // Create a purchase record
                    await db.collection('user-purchases').add({
                        userId: paymentData.userId,
                        productId,
                        productData,
                        purchaseDate: new Date(),
                        paymentId: paymentDoc.id,
                        amount: paymentData.amount,
                        currency: paymentData.currency,
                    });
                }
            } else if (paymentData.itemType === 'subscription') {
                // Process subscription activation
                const planId = paymentData.itemId;
                const planDoc = await db.collection('app-settings/monetization/subscription-plans').doc(planId).get();

                if (planDoc.exists) {
                    const planData = planDoc.data();

                    // Update user subscription status
                    const userRef = db.collection('users').doc(paymentData.userId).collection('profile').doc(paymentData.userId);
                    await userRef.update({
                        subscription: {
                            planId,
                            planName: planData?.name,
                            status: 'active',
                            activatedAt: new Date(),
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        }
                    });
                }
            } else if (paymentData.itemType === 'subscription') {
                // Handle subscription activation
                const planId = paymentData.itemId;
                const planDoc = await db.collection('app-settings/monetization/subscription-plans').doc(planId).get();

                if (planDoc.exists) {
                    const planData = planDoc.data();

                    // Update user subscription status
                    const userProfileRef = db.doc(`users/${paymentData.userId}/profile/${paymentData.userId}`);
                    await userProfileRef.update({
                        subscription: {
                            planId,
                            planName: planData?.name,
                            status: 'active',
                            activatedAt: new Date(),
                            expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
                        }
                    });
                }
            }
            // Add other item types here (course, etc.)
        }

        await paymentDoc.ref.update(updateData);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
