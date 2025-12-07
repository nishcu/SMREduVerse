import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import CashfreeService from '@/lib/cashfree';
import { awardCoins } from '@/lib/coin-transactions';

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Get Firebase auth token from request
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Get payment order from Firestore
        const db = getAdminDb();
        const paymentQuery = await db
            .collection('payments')
            .where('orderId', '==', orderId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (paymentQuery.empty) {
            return NextResponse.json(
                { error: 'Payment order not found' },
                { status: 404 }
            );
        }

        const paymentDoc = paymentQuery.docs[0];
        const paymentData = paymentDoc.data();

        // Check current status in Cashfree
        const cashfreeOrder = await CashfreeService.getOrderStatus(orderId);

        // Update payment status in Firestore
        const updateData: any = {
            status: cashfreeOrder.order_status,
            updatedAt: new Date(),
        };

        if (cashfreeOrder.payment_session_id) {
            updateData.cashfreePaymentId = cashfreeOrder.payment_session_id;
        }

        // If payment is successful and not already processed
        if (cashfreeOrder.order_status === 'PAID' && paymentData.status !== 'SUCCESS') {
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

                    updateData.itemDetails = bundleData;
                }
            } else if (paymentData.itemType === 'marketplace_item') {
                // Record marketplace purchase
                const productId = paymentData.itemId;
                const productDoc = await db.collection('marketplace-products').doc(productId).get();

                if (productDoc.exists) {
                    const productData = productDoc.data();

                    // Create a purchase record
                    await db.collection('user-purchases').add({
                        userId,
                        productId,
                        productData,
                        purchaseDate: new Date(),
                        paymentId: paymentDoc.id,
                        amount: paymentData.amount,
                        currency: paymentData.currency,
                    });

                    updateData.itemDetails = productData;
                }
            } else if (paymentData.itemType === 'subscription') {
                // Process subscription activation
                const planId = paymentData.itemId;
                const planDoc = await db.collection('app-settings/monetization/subscription-plans').doc(planId).get();

                if (planDoc.exists) {
                    const planData = planDoc.data();

                    // Update user subscription status
                    const userRef = db.collection('users').doc(userId).collection('profile').doc(userId);
                    await userRef.update({
                        subscription: {
                            planId,
                            planName: planData?.name,
                            status: 'active',
                            activatedAt: new Date(),
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                        }
                    });

                    updateData.itemDetails = planData;
                }
            } else if (paymentData.itemType === 'subscription') {
                // Handle subscription activation
                const planId = paymentData.itemId;
                const planDoc = await db.collection('app-settings/monetization/subscription-plans').doc(planId).get();

                if (planDoc.exists) {
                    const planData = planDoc.data();

                    // Update user subscription status
                    const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);
                    await userProfileRef.update({
                        subscription: {
                            planId,
                            planName: planData?.name,
                            status: 'active',
                            activatedAt: new Date(),
                            expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
                        }
                    });

                    updateData.itemDetails = planData;
                }
            }
            // Add other item types here (course, etc.)
        }

        await paymentDoc.ref.update(updateData);

        return NextResponse.json({
            success: true,
            data: {
                orderId,
                status: cashfreeOrder.order_status,
                amount: cashfreeOrder.order_amount,
                currency: cashfreeOrder.order_currency,
            },
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        );
    }
}
