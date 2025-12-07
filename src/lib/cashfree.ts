import crypto from 'crypto';

const CASHFREE_BASE_URLS = {
  sandbox: 'https://sandbox.cashfree.com/pg',
  production: 'https://api.cashfree.com/pg',
} as const;

type CashfreeEnv = keyof typeof CASHFREE_BASE_URLS;

export interface CashfreeCreateOrderPayload {
  order_id: string;
  order_amount: number;
  order_currency?: 'INR';
  customer_details: {
    customer_id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
  };
  order_note?: string;
  order_meta?: {
    return_url?: string;
    notify_url?: string;
    payment_methods?: string;
  };
  order_tags?: Record<string, string>;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_currency: string;
  order_amount: number;
  order_status: 'PAID' | 'ACTIVE' | 'EXPIRED' | 'FAILED';
  payment_session_id: string;
  order_expiry_time?: string;
}

export interface CashfreeOrderDetail extends Partial<CashfreeOrderResponse> {
  payments?: Array<{
    cf_payment_id: string;
    payment_status: string;
    payment_method: string;
    payment_amount: number;
    payment_time: string;
  }>;
  customer_details?: CashfreeCreateOrderPayload['customer_details'];
}

function getCashfreeEnv(): CashfreeEnv {
  const env = (process.env.CASHFREE_ENV || process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox').toLowerCase();
  return env === 'production' ? 'production' : 'sandbox';
}

function getCashfreeBaseUrl() {
  const env = getCashfreeEnv();
  return CASHFREE_BASE_URLS[env];
}

function getCashfreeHeaders() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;

  if (!appId || !secret) {
    throw new Error('Cashfree credentials are not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }

  return {
    'Content-Type': 'application/json',
    'x-api-version': '2022-09-01',
    'x-client-id': appId,
    'x-client-secret': secret,
  };
}

async function cashfreeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getCashfreeBaseUrl();
  const headers = getCashfreeHeaders();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as any)?.message || response.statusText || 'Cashfree request failed';
    throw new Error(message);
  }

  return data as T;
}

export async function createCashfreeOrder(payload: CashfreeCreateOrderPayload) {
  return cashfreeRequest<CashfreeOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      order_currency: 'INR',
      ...payload,
    }),
  });
}

export async function getCashfreeOrder(orderId: string) {
  return cashfreeRequest<CashfreeOrderDetail>(`/orders/${orderId}`, {
    method: 'GET',
  });
}

export function verifyCashfreeWebhook(signature: string | null, rawBody: string) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('CASHFREE_WEBHOOK_SECRET is not configured.');
  }
  if (!signature) {
    return false;
  }
  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');
  return computed === signature;
}

export function getCashfreeSdkMode() {
  return getCashfreeEnv() === 'production' ? 'PROD' : 'TEST';
}

export function getCashfreeScriptUrl() {
  const env = getCashfreeEnv();
  return env === 'production'
    ? 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js'
    : 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js';
}
