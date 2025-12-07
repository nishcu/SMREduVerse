const API_VERSION = '2022-09-01';
const CASHFREE_MODE = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
const BASE_URL = CASHFREE_MODE === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

const APP_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

function ensureCashfreeConfig() {
  if (!APP_ID || !SECRET_KEY) {
    throw new Error('Cashfree credentials are missing. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }
}

async function cashfreeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  ensureCashfreeConfig();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-version': API_VERSION,
    'x-client-id': APP_ID!,
    'x-client-secret': SECRET_KEY!,
    ...init.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = (errorPayload?.message as string) || `Cashfree request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export interface CashfreeCustomerDetails {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface CashfreeOrderMeta {
  return_url?: string;
  notify_url?: string;
  payment_methods?: string;
}

export interface CashfreeCreateOrderRequest {
  order_id: string;
  order_amount: number;
  order_currency: 'INR';
  customer_details: CashfreeCustomerDetails;
  order_note?: string;
  order_meta?: CashfreeOrderMeta;
  order_tags?: Record<string, string>;
}

export interface CashfreeOrderPayment {
  cf_payment_id: number;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_time: string;
  payment_method?: string;
  payment_group?: string;
  auth_id?: string;
  bank_reference?: string;
  error_details?: {
    error_code?: string;
    error_description?: string;
  };
}

export interface CashfreeOrderResponse {
  cf_order_id: number;
  order_id: string;
  order_status: string;
  order_currency: string;
  order_amount: number;
  payment_session_id?: string;
  order_token?: string;
  payments?: CashfreeOrderPayment[];
}

export function createCashfreeOrder(payload: CashfreeCreateOrderRequest) {
  return cashfreeRequest<CashfreeOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function retrieveCashfreeOrder(orderId: string) {
  return cashfreeRequest<CashfreeOrderResponse>(`/orders/${orderId}`, {
    method: 'GET',
  });
}

export { CASHFREE_MODE };
