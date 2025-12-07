'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import type { CoinBundle, SubscriptionPlan, PartnerProduct } from '@/lib/types';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { awardCoins } from '@/lib/coin-transactions';

export type CashfreePurchaseType = 'coin_bundle' | 'subscription_plan' | 'partner_product';

interface CreatePaymentIntentParams {
  userId: string;
  itemType: CashfreePurchaseType;
  itemId: string;
  partnerId?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface CashfreeOrderRecord {
  userId: string;
  itemType: CashfreePurchaseType;
  itemId: string;
  partnerId?: string | null;
  amount: number;
  currency: 'INR';
  status: string;
  description: string;
  coins?: number;
  planSnapshot?: SubscriptionPlan & { id: string };
  productSnapshot?: PartnerProduct & { id: string };
  customer: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
  };
  environment: 'sandbox' | 'production';
  cashfree: {
    orderId: string;
    orderToken: string;
    paymentSessionId: string;
    latestStatus?: any;
    lastSyncedAt?: FieldValue;
  };
  metadata?: Record<string, unknown>;
  fulfillment?: Record<string, any>;
  createdAt: FieldValue;
  updatedAt: FieldValue;
}

interface PurchaseResolution {
  amount: number;
  description: string;
  coins?: number;
  metadata?: Record<string, unknown>;
  planSnapshot?: SubscriptionPlan & { id: string };
  productSnapshot?: PartnerProduct & { id: string };
}

interface VerifyResult {
  status: string;
  orderId: string;
  amount: number;
  currency: string;
  coinsAwarded?: number;
  newBalance?: number;
  subscription?: {
    planId: string;
    planName: string;
  };
}

const CASHFREE_MODE: 'sandbox' | 'production' =
  process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || '2023-08-01';
const CASHFREE_BASE_URL =
  CASHFREE_MODE === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

export function getCashfreeMode() {
  return CASHFREE_MODE;
}

export async function createCashfreePaymentIntent(params: CreatePaymentIntentParams) {
  ensureCashfreeConfig();
  const db = getAdminDb();
  const userProfileRef = db.doc(`users/${params.userId}/profile/${params.userId}`);
  const userProfileSnap = await userProfileRef.get();

  if (!userProfileSnap.exists) {
    throw new Error('User profile not found.');
  }

  const userProfile = userProfileSnap.data() as any;
  const resolution = await resolvePurchaseItem(db, params);
  const orderId = buildOrderId(params.itemType);

  const customerDetails = {
    customer_id: params.userId,
    customer_email: params.customer?.email || userProfile.email || `${params.userId}@example.com`,
    customer_phone: sanitizePhone(params.customer?.phone || userProfile.mobileNumber) || '9999999999',
    customer_name: params.customer?.name || userProfile.name || 'GenZeerr Learner',
  };

  const orderMeta = {
    return_url: `${getReturnUrl()}?cf_order_id={order_id}&cf_order_token={order_token}`,
  };

  const cashfreeResponse = await cashfreeRequest<CashfreeCreateOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      order_amount: resolution.amount,
      order_currency: 'INR',
      order_note: resolution.description,
      customer_details: customerDetails,
      order_meta: orderMeta,
    }),
  });

  const ordersCollection = getOrdersCollection(db);
  const orderRecord: CashfreeOrderRecord = {
    userId: params.userId,
    itemType: params.itemType,
    itemId: params.itemId,
    partnerId: params.partnerId || null,
    amount: resolution.amount,
    currency: 'INR',
    status: 'created',
    description: resolution.description,
    coins: resolution.coins,
    planSnapshot: resolution.planSnapshot,
    productSnapshot: resolution.productSnapshot,
    customer: {
      id: customerDetails.customer_id,
      email: customerDetails.customer_email,
      phone: customerDetails.customer_phone,
      name: customerDetails.customer_name,
    },
    environment: CASHFREE_MODE,
    cashfree: {
      orderId: cashfreeResponse.order_id,
      orderToken: cashfreeResponse.order_token,
      paymentSessionId: cashfreeResponse.payment_session_id,
    },
    metadata: resolution.metadata,
    fulfillment: {},
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await ordersCollection.doc(cashfreeResponse.order_id).set(orderRecord);

  return {
    orderId: cashfreeResponse.order_id,
    paymentSessionId: cashfreeResponse.payment_session_id,
    cashfreeMode: CASHFREE_MODE,
  };
}

export async function verifyCashfreeOrder(orderId: string, userId: string): Promise<VerifyResult> {
  ensureCashfreeConfig();
  const db = getAdminDb();
  const orderRef = getOrdersCollection(db).doc(orderId);
  const snapshot = await orderRef.get();

  if (!snapshot.exists) {
    throw new Error('Order not found.');
  }

  const order = snapshot.data() as CashfreeOrderRecord;
  if (order.userId !== userId) {
    throw new Error('Order not available.');
  }

  const cashfreeOrder = await cashfreeRequest<CashfreeOrderDetails>(`/orders/${orderId}`, {
    method: 'GET',
  });

  const normalizedStatus = normalizeStatus(cashfreeOrder.order_status);
  const updates: Record<string, any> = {
    status: normalizedStatus,
    cashfree: {
      ...order.cashfree,
      latestStatus: cashfreeOrder,
      lastSyncedAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  };

  const fulfillmentUpdates: Record<string, any> = { ...(order.fulfillment || {}) };
  const result: VerifyResult = {
    status: normalizedStatus,
    orderId,
    amount: order.amount,
    currency: order.currency,
  };

  if (normalizedStatus === 'paid') {
    await applyFulfillment(db, order, fulfillmentUpdates, result);
  }

  if (Object.keys(fulfillmentUpdates).length > 0) {
    updates.fulfillment = fulfillmentUpdates;
  }

  await orderRef.set(updates, { merge: true });
  return result;
}

async function applyFulfillment(
  db: Firestore,
  order: CashfreeOrderRecord,
  fulfillment: Record<string, any>,
  result: VerifyResult
) {
  if (order.itemType === 'coin_bundle' && order.coins && !fulfillment.coinsIssued) {
    const awardResult = await awardCoins(
      order.userId,
      order.coins,
      `Cashfree purchase - ${order.description}`,
      { paymentGateway: 'cashfree', transactionType: 'topup' }
    );

    if (!awardResult.success) {
      throw new Error(awardResult.error || 'Failed to credit coins.');
    }

    fulfillment.coinsIssued = {
      amount: order.coins,
      newBalance: awardResult.newBalance,
      at: FieldValue.serverTimestamp(),
    };

    result.coinsAwarded = order.coins;
    result.newBalance = awardResult.newBalance;
  }

  if (
    order.itemType === 'subscription_plan' &&
    order.planSnapshot &&
    !fulfillment.subscriptionActivated
  ) {
    const userProfileRef = db.doc(`users/${order.userId}/profile/${order.userId}`);
    await userProfileRef.set(
      {
        subscription: {
          planId: order.planSnapshot.id,
          planName: order.planSnapshot.name,
          price: order.amount,
          currency: order.currency,
          pricePeriod: order.planSnapshot.pricePeriod,
          status: 'active',
          activatedAt: FieldValue.serverTimestamp(),
          lastPaymentGateway: 'cashfree',
        },
      },
      { merge: true }
    );

    fulfillment.subscriptionActivated = {
      planId: order.planSnapshot.id,
      planName: order.planSnapshot.name,
      at: FieldValue.serverTimestamp(),
    };

    result.subscription = {
      planId: order.planSnapshot.id,
      planName: order.planSnapshot.name,
    };
  }

  if (order.itemType === 'partner_product' && !fulfillment.partnerOrderConfirmed) {
    fulfillment.partnerOrderConfirmed = {
      at: FieldValue.serverTimestamp(),
    };
  }
}

async function resolvePurchaseItem(
  db: Firestore,
  params: CreatePaymentIntentParams
): Promise<PurchaseResolution> {
  switch (params.itemType) {
    case 'coin_bundle': {
      const doc = await db.doc(`app-settings/monetization/coin-bundles/${params.itemId}`).get();
      if (!doc.exists) {
        throw new Error('Coin bundle not found.');
      }
      const bundle = doc.data() as CoinBundle;
      const amount = parseAmount(bundle.price);
      if (!amount) {
        throw new Error('Invalid bundle price.');
      }
      return {
        amount,
        coins: bundle.coins,
        description: `${bundle.coins} Knowledge Coins`,
        metadata: { displayPrice: bundle.price },
      };
    }
    case 'subscription_plan': {
      const doc = await db.doc(`app-settings/monetization/subscription-plans/${params.itemId}`).get();
      if (!doc.exists) {
        throw new Error('Subscription plan not found.');
      }
      const plan = doc.data() as SubscriptionPlan;
      const amount = parseAmount(plan.price);
      if (!amount) {
        throw new Error('Invalid subscription price.');
      }
      return {
        amount,
        description: `${plan.name} subscription`,
        planSnapshot: { ...plan, id: params.itemId },
      };
    }
    case 'partner_product': {
      if (!params.partnerId) {
        throw new Error('Partner ID is required for product purchases.');
      }
      const doc = await db.doc(`partners/${params.partnerId}/products/${params.itemId}`).get();
      if (!doc.exists) {
        throw new Error('Partner product not found.');
      }
      const product = doc.data() as PartnerProduct;
      if (!product.priceInRupees) {
        throw new Error('This product is not configured for cash payments.');
      }
      return {
        amount: product.priceInRupees,
        description: product.title,
        productSnapshot: { ...product, id: params.itemId },
      };
    }
    default:
      throw new Error('Unsupported purchase type.');
  }
}

function parseAmount(value?: string | number) {
  if (typeof value === 'number') {
    return Math.round(value * 100) / 100;
  }
  if (!value) {
    return 0;
  }
  const sanitized = value.replace(/[^0-9.]/g, '');
  const amount = Number.parseFloat(sanitized);
  if (Number.isNaN(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
}

function sanitizePhone(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.slice(-10) || undefined;
}

function buildOrderId(itemType: CashfreePurchaseType) {
  const shortType = itemType.split('_').map(part => part[0]).join('');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CF${shortType}-${Date.now()}-${random}`;
}

function normalizeStatus(status?: string) {
  switch ((status || '').toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
      return 'paid';
    case 'ACTIVE':
    case 'CREATED':
    case 'AUTHORIZED':
      return 'pending';
    case 'FAILED':
    case 'CANCELLED':
      return 'failed';
    case 'EXPIRED':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function getOrdersCollection(db: Firestore) {
  return db.collection('payments').doc('cashfree').collection('orders');
}

function getReturnUrl() {
  const base =
    process.env.CASHFREE_RETURN_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    'http://localhost:3000';
  try {
    return new URL('/billing', base).toString();
  } catch {
    return 'http://localhost:3000/billing';
  }
}

function ensureCashfreeConfig() {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET) {
    throw new Error('Cashfree credentials are not configured.');
  }
}

async function cashfreeRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${CASHFREE_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CASHFREE_APP_ID as string,
      'x-client-secret': CASHFREE_SECRET as string,
      'x-api-version': CASHFREE_API_VERSION,
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Cashfree request failed.';
    throw new Error(message);
  }
  return payload as T;
}

interface CashfreeCreateOrderResponse {
  order_id: string;
  order_token: string;
  payment_session_id: string;
}

interface CashfreeOrderDetails {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: string;
  payment_session_id?: string;
  cf_payment_id?: string;
  payments?: Array<Record<string, unknown>>;
}
