import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createCashfreeOrder } from '@/lib/cashfree';
import { parsePriceToNumber } from '@/lib/utils';
import type { CoinBundle, SubscriptionPlan } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
  itemId: z.string().min(1, 'itemId is required'),
  itemType: z.enum(['subscription', 'coin_bundle']),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const validated = bodySchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const { idToken, itemId, itemType } = validated.data;

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const profileRef = db.doc(`users/${uid}/profile/${uid}`);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const profile = profileSnap.data() || {};

    const { itemName, amount, snapshot } = await resolveItem(db, itemType, itemId);

    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid pricing configured for selection.' }, { status: 400 });
    }

    const orderId = `cf_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
    const appUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const cashfreeOrder = await createCashfreeOrder({
      order_id: orderId,
      order_amount: amount,
      customer_details: {
        customer_id: uid,
        customer_name: profile.name || decoded.name || 'Learner',
        customer_email: profile.email || decoded.email || 'no-email@example.com',
        customer_phone: profile.mobileNumber || decoded.phone_number || '9999999999',
      },
      order_note: `${itemType === 'coin_bundle' ? 'Coin bundle' : 'Subscription'} purchase - ${itemName}`,
      order_meta: {
        return_url: `${appUrl}/billing?order_id=${orderId}&status={status}`,
        notify_url: `${appUrl}/api/payments/cashfree/webhook`,
      },
      order_tags: {
        itemType,
        itemId,
        userId: uid,
      },
    });

    await db.collection('cashfreeOrders').doc(orderId).set({
      id: orderId,
      orderId,
      cfOrderId: cashfreeOrder.cf_order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      itemType,
      itemId,
      itemName,
      amount,
      currency: 'INR',
      userId: uid,
      userEmail: profile.email || decoded.email || null,
      userName: profile.name || decoded.name || null,
      userPhone: profile.mobileNumber || decoded.phone_number || null,
      status: 'CREATED',
      coins: itemType === 'coin_bundle' ? (snapshot as CoinBundle).coins : undefined,
      bundleSnapshot: itemType === 'coin_bundle' ? snapshot : undefined,
      subscriptionSnapshot: itemType === 'subscription' ? snapshot : undefined,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      orderId,
      paymentSessionId: cashfreeOrder.payment_session_id,
      cashfreeOrderId: cashfreeOrder.cf_order_id,
      amount,
      currency: 'INR',
      itemName,
      itemType,
    });
  } catch (error: any) {
    console.error('Cashfree order creation failed:', error);
    const message = error?.message || 'Unable to create Cashfree order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function resolveItem(db: Firestore, itemType: 'subscription' | 'coin_bundle', itemId: string) {
  if (itemType === 'coin_bundle') {
    const bundleRef = db.doc(`app-settings/monetization/coin-bundles/${itemId}`);
    const bundleSnap = await bundleRef.get();
    if (!bundleSnap.exists) {
      throw new Error('Coin bundle not found.');
    }
    const bundle = bundleSnap.data() as CoinBundle;
    const amount = parsePriceToNumber(bundle.price);
    return { itemName: `${bundle.coins.toLocaleString()} Knowledge Coins`, amount, snapshot: { id: itemId, ...bundle } };
  }

  const planRef = db.doc(`app-settings/monetization/subscription-plans/${itemId}`);
  const planSnap = await planRef.get();
  if (!planSnap.exists) {
    throw new Error('Subscription plan not found.');
  }
  const plan = planSnap.data() as SubscriptionPlan;
  const amount = parsePriceToNumber(plan.price);
  return { itemName: plan.name, amount, snapshot: { id: itemId, ...plan } };
}
