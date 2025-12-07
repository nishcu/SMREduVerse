
'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { SubscriptionPlan, CoinBundle } from '@/lib/types';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { awardCoins } from '@/lib/coin-transactions';
import { createCashfreeOrder, retrieveCashfreeOrder, type CashfreeOrderResponse } from '@/lib/cashfree';


export async function getSubscriptionPlansAction(): Promise<{ success: boolean; data?: SubscriptionPlan[]; error?: string }> {
    const db = getAdminDb();
    try {
        const snapshot = await db.collection('app-settings/monetization/subscription-plans').get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching subscription plans: ", error);
        return { success: false, error: error.message };
    }
}

export async function getCoinBundlesAction(): Promise<{ success: boolean; data?: CoinBundle[]; error?: string }> {
     const db = getAdminDb();
    try {
        const snapshot = await db.collection('app-settings/monetization/coin-bundles').orderBy('coins', 'asc').get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoinBundle));
        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching coin bundles: ", error);
        return { success: false, error: error.message };
    }
}

type PurchaseType = 'subscription' | 'coin_bundle';

interface CashfreeOrderRecord {
    orderId: string;
    userId: string;
    purchaseType: PurchaseType;
    itemId: string;
    amount: number;
    currency: 'INR';
    metadata: Record<string, any>;
    status: string;
    paymentSessionId: string;
    cfOrderId?: number;
    cashfreeOrder?: CashfreeOrderResponse;
    fulfillment?: {
        processed: boolean;
        processedAt?: Timestamp;
        notes?: string;
    };
    createdAt: Timestamp | FieldValue;
    updatedAt?: Timestamp | FieldValue;
}

const ORDER_COLLECTION = 'cashfree-orders';
const checkoutInputSchema = z.object({
    idToken: z.string().min(10, 'Missing session token'),
    itemId: z.string().min(1, 'Missing item identifier'),
});

function parsePriceLabel(label?: string): number {
    if (!label) {
        throw new Error('Price information is missing.');
    }
    const normalized = label.replace(/[^0-9.]/g, '');
    const amount = parseFloat(normalized);
    if (Number.isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid price format: ${label}`);
    }
    return Number(amount.toFixed(2));
}

function buildCustomerPhone(phone?: string | null): string {
    if (phone) {
        const sanitized = phone.replace(/\D/g, '');
        if (sanitized.length >= 6 && sanitized.length <= 14) {
            return sanitized;
        }
    }
    return '9999999999';
}

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || 'http://localhost:3000';

async function initiateCheckout({
    idToken,
    itemId,
    purchaseType,
}: {
    idToken: string;
    itemId: string;
    purchaseType: PurchaseType;
}) {
    const auth = getAdminAuth();
    const db = getAdminDb();

    const validated = checkoutInputSchema.safeParse({ idToken, itemId });
    if (!validated.success) {
        return { success: false, error: validated.error.errors[0]?.message || 'Invalid input.' };
    }

    try {
        const decoded = await auth.verifyIdToken(idToken);
        const userId = decoded.uid;
        const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);
        const userProfileSnap = await userProfileRef.get();

        if (!userProfileSnap.exists) {
            return { success: false, error: 'User profile not found.' };
        }

        const userProfile = userProfileSnap.data() || {};

        let amount = 0;
        let metadata: Record<string, any> = {};
        let orderNote = '';

        if (purchaseType === 'coin_bundle') {
            const bundleSnap = await db.doc(`app-settings/monetization/coin-bundles/${itemId}`).get();
            if (!bundleSnap.exists) {
                return { success: false, error: 'Coin bundle not found.' };
            }
            const bundle = { id: bundleSnap.id, ...bundleSnap.data() } as CoinBundle;
            amount = parsePriceLabel(bundle.price);
            metadata = {
                bundleId: bundle.id,
                bundleCoins: bundle.coins,
                priceLabel: bundle.price,
            };
            orderNote = `Knowledge Coin Bundle - ${bundle.coins} coins`;
        } else {
            const planSnap = await db.doc(`app-settings/monetization/subscription-plans/${itemId}`).get();
            if (!planSnap.exists) {
                return { success: false, error: 'Subscription plan not found.' };
            }
            const plan = { id: planSnap.id, ...planSnap.data() } as SubscriptionPlan;
            amount = parsePriceLabel(plan.price);
            metadata = {
                planId: plan.id,
                planName: plan.name,
                priceLabel: plan.price,
                pricePeriod: plan.pricePeriod,
            };
            orderNote = `Subscription Upgrade - ${plan.name}`;
        }

        const orderId = `smreduverse_${purchaseType}_${randomUUID()}`;
        const orderPayload = await createCashfreeOrder({
            order_id: orderId,
            order_amount: amount,
            order_currency: 'INR',
            customer_details: {
                customer_id: userId,
                customer_name: userProfile.name || decoded.name || 'Student',
                customer_email: userProfile.email || decoded.email || 'support@smreduverse.com',
                customer_phone: buildCustomerPhone(userProfile.mobileNumber || decoded.phone_number),
            },
            order_note: orderNote,
            order_meta: {
                return_url: `${appBaseUrl}/billing?order_id={order_id}`,
            },
            order_tags: {
                purchaseType,
                itemId,
                userId,
            },
        });

        if (!orderPayload.payment_session_id) {
            throw new Error('Cashfree did not return a payment session id.');
        }

        await db.collection(ORDER_COLLECTION).doc(orderId).set({
            orderId,
            userId,
            purchaseType,
            itemId,
            amount,
            currency: 'INR',
            metadata,
            status: orderPayload.order_status || 'CREATED',
            cfOrderId: orderPayload.cf_order_id,
            paymentSessionId: orderPayload.payment_session_id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            orderId,
            paymentSessionId: orderPayload.payment_session_id,
            amount,
        };
    } catch (error: any) {
        console.error(`initiateCheckout:${purchaseType} error`, error);
        return { success: false, error: error.message || 'Unable to start payment.' };
    }
}

async function fulfillOrder(db: Firestore, order: CashfreeOrderRecord) {
    if (order.purchaseType === 'coin_bundle') {
        const coins = order.metadata?.bundleCoins;
        if (!coins) {
            throw new Error('Coin bundle metadata is missing.');
        }
        const awardResult = await awardCoins(
            order.userId,
            coins,
            `Purchased ${coins} Knowledge Coins via Cashfree`,
            { source: 'cashfree', orderId: order.orderId },
        );

        if (!awardResult.success) {
            throw new Error(awardResult.error || 'Failed to credit Knowledge Coins.');
        }
        return `Credited ${coins} Knowledge Coins.`;
    }

    if (order.purchaseType === 'subscription') {
        const planId = order.metadata?.planId;
        const planName = order.metadata?.planName;
        const priceLabel = order.metadata?.priceLabel;
        const pricePeriod = order.metadata?.pricePeriod;

        if (!planId || !planName || !priceLabel) {
            throw new Error('Subscription metadata is incomplete.');
        }

        const profileRef = db.doc(`users/${order.userId}/profile/${order.userId}`);
        await profileRef.update({
            subscription: {
                planId,
                planName,
                priceLabel,
                pricePeriod,
                orderId: order.orderId,
                status: 'active',
                activatedAt: FieldValue.serverTimestamp(),
            },
        });

        return `Activated ${planName} subscription.`;
    }

    throw new Error('Unsupported purchase type.');
}

export async function initiateCoinBundleCheckoutAction(params: { idToken: string; bundleId: string }) {
    return initiateCheckout({
        idToken: params.idToken,
        itemId: params.bundleId,
        purchaseType: 'coin_bundle',
    });
}

export async function initiateSubscriptionCheckoutAction(params: { idToken: string; planId: string }) {
    return initiateCheckout({
        idToken: params.idToken,
        itemId: params.planId,
        purchaseType: 'subscription',
    });
}

export async function confirmCashfreePaymentAction(params: { idToken: string; orderId: string }) {
    const auth = getAdminAuth();
    const db = getAdminDb();

    if (!params?.orderId || !params?.idToken) {
        return { success: false, error: 'Missing parameters.' };
    }

    try {
        const decoded = await auth.verifyIdToken(params.idToken);
        const userId = decoded.uid;

        const orderRef = db.collection(ORDER_COLLECTION).doc(params.orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            return { success: false, error: 'Order not found.' };
        }

        const order = orderSnap.data() as CashfreeOrderRecord;

        if (order.userId !== userId) {
            return { success: false, error: 'This order does not belong to the current user.' };
        }

        if (order.fulfillment?.processed) {
            return { success: true, status: order.status, alreadyProcessed: true };
        }

        const latestOrder = await retrieveCashfreeOrder(order.orderId);

        if (latestOrder.order_status !== 'PAID') {
            return {
                success: false,
                status: latestOrder.order_status,
                error: 'Payment is not completed yet. Please try again in a moment.',
            };
        }

        await orderRef.update({
            status: latestOrder.order_status,
            cashfreeOrder: latestOrder,
            updatedAt: FieldValue.serverTimestamp(),
        });

        try {
            const fulfillmentMessage = await fulfillOrder(db, order);
            await orderRef.update({
                fulfillment: {
                    processed: true,
                    processedAt: FieldValue.serverTimestamp(),
                    notes: fulfillmentMessage,
                },
            });

            return { success: true, status: 'PAID' };
        } catch (fulfillmentError: any) {
            console.error('Cashfree fulfillment error:', fulfillmentError);
            return { success: false, error: fulfillmentError.message || 'Failed to fulfill the order after payment.' };
        }
    } catch (error: any) {
        console.error('confirmCashfreePaymentAction error:', error);
        return { success: false, error: error.message || 'Unable to confirm payment.' };
    }
}
