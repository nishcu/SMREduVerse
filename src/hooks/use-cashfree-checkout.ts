'use client';

import { useCallback, useEffect, useState } from 'react';

type ItemType = 'subscription' | 'coin_bundle';

interface StartPaymentOptions {
  itemId: string;
  itemType: ItemType;
  idToken: string;
}

const env = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'sandbox').toLowerCase();
const scriptUrl =
  env === 'production'
    ? 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js'
    : 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js';
const sdkMode = env === 'production' ? 'PROD' : 'TEST';

let scriptPromise: Promise<void> | null = null;

export function useCashfreeCheckout() {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    loadCashfreeScript().then(() => setSdkReady(true)).catch(() => setSdkReady(false));
  }, []);

  const startPayment = useCallback(async ({ itemId, itemType, idToken }: StartPaymentOptions) => {
    if (!idToken) {
      throw new Error('Authentication required. Please sign in again.');
    }

    await loadCashfreeScript();
    const cashfree = await getCashfreeInstance();

    const orderResponse = await fetch('/api/payments/cashfree/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, itemType, idToken }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(orderData?.error || 'Failed to start payment.');
    }

    const checkoutResult = await cashfree.checkout({
      paymentSessionId: orderData.paymentSessionId,
      redirectTarget: '_self',
    });

    if (checkoutResult?.error) {
      throw new Error(checkoutResult.error);
    }

    const confirmResponse = await fetch('/api/payments/cashfree/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, orderId: orderData.orderId }),
    });

    const confirmData = await confirmResponse.json();

    if (!confirmResponse.ok) {
      throw new Error(confirmData?.error || 'Payment verification failed.');
    }

    return {
      orderId: orderData.orderId,
      amount: orderData.amount,
      itemName: orderData.itemName,
      itemType: orderData.itemType as ItemType,
      ...confirmData,
    };
  }, []);

  return {
    sdkReady,
    startPayment,
  };
}

async function loadCashfreeScript() {
  if (typeof window === 'undefined') {
    throw new Error('Cashfree SDK can only be loaded in the browser.');
  }

  if (window.Cashfree) {
    return;
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK.'));
      document.body.appendChild(script);
    }).catch((error) => {
      scriptPromise = null;
      throw error;
    });
  }

  return scriptPromise;
}

async function getCashfreeInstance() {
  if (typeof window === 'undefined' || !window.Cashfree) {
    throw new Error('Cashfree SDK is not available.');
  }
  return new window.Cashfree({ mode: sdkMode });
}
