import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin';
import { awardCoins } from './coin-transactions';
import { logActivity } from './activity-logger';
import type { CashfreeOrderRecord, UserSubscription } from '@/lib/types';

interface ApplyResult {
  newBalance?: number;
  subscription?: UserSubscription;
}

export async function finalizeCashfreeOrder(
  orderId: string,
  paymentDetails: any,
  source: 'confirm' | 'webhook'
): Promise<{ order: CashfreeOrderRecord; alreadyProcessed: boolean; applyResult?: ApplyResult }> {
  const db = getAdminDb();
  const orderRef = db.collection('cashfreeOrders').doc(orderId);

  const { order, alreadyProcessed } = await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new Error('Order not found');
    }

    const data = orderSnap.data() as CashfreeOrderRecord;
    const processed = data.status === 'PAID' && data.benefitsApplied;

    if (!processed) {
      tx.update(orderRef, {
        status: 'PAID',
        updatedAt: FieldValue.serverTimestamp(),
        paidAt: FieldValue.serverTimestamp(),
        lastStatusSource: source,
        paymentDetails,
      });
    }

    return { order: { ...data }, alreadyProcessed: processed };
  });

  if (alreadyProcessed) {
    return { order, alreadyProcessed: true };
  }

  const applyResult = await applyOrderBenefits(order);

  await orderRef.update({
    benefitsApplied: true,
    benefitsAppliedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { order, alreadyProcessed: false, applyResult };
}

async function applyOrderBenefits(order: CashfreeOrderRecord): Promise<ApplyResult | undefined> {
  if (order.itemType === 'coin_bundle') {
    const coins =
      order.coins ||
      order.bundleSnapshot?.coins;

    if (!coins || coins <= 0) {
      throw new Error('Coin bundle information missing on order.');
    }

    const awardResult = await awardCoins(
      order.userId,
      coins,
      `Cashfree purchase - ${order.itemName}`,
      {
        activityType: 'marketplace',
        activityTitle: order.itemName,
        orderId: order.orderId,
        provider: 'cashfree',
      }
    );

    if (!awardResult.success) {
      throw new Error(awardResult.error || 'Failed to award coins.');
    }

    await logActivity(
      order.userId,
      'purchase',
      `Purchased ${order.itemName}`,
      `Added ${coins} Knowledge Coins`,
      {
        amount: order.amount,
        currency: order.currency,
        orderId: order.orderId,
        provider: 'cashfree',
      }
    );

    return { newBalance: awardResult.newBalance };
  }

  if (order.itemType === 'subscription') {
    const db = getAdminDb();
    const subscription = buildSubscriptionPayload(order);

    const profileRef = db.doc(`users/${order.userId}/profile/${order.userId}`);
    await profileRef.set({ subscription }, { merge: true });

    await logActivity(
      order.userId,
      'purchase',
      `Activated ${subscription.planName} subscription`,
      `Subscription renewed via Cashfree`,
      {
        amount: order.amount,
        currency: order.currency,
        orderId: order.orderId,
        provider: 'cashfree',
      }
    );

    return { subscription };
  }

  return undefined;
}

function buildSubscriptionPayload(order: CashfreeOrderRecord): UserSubscription {
  const snapshot = order.subscriptionSnapshot;
  const planName = snapshot?.name || order.itemName;
  const price = snapshot?.price || `₹${order.amount}`;

  return {
    planId: order.itemId,
    planName,
    price,
    pricePeriod: snapshot?.pricePeriod || '',
    features: snapshot?.features || [],
    status: 'active',
    startedAt: FieldValue.serverTimestamp(),
    renewedAt: FieldValue.serverTimestamp(),
  };
}
