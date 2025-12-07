'use client';

import { useCallback, useRef } from 'react';
import { load } from '@cashfreepayments/cashfree-js';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export type CashfreeItemType = 'coin_bundle' | 'subscription_plan' | 'partner_product';

export interface CashfreePaymentPayload {
  itemType: CashfreeItemType;
  itemId: string;
  partnerId?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
}

export interface CashfreePaymentResult {
  success: boolean;
  status?: string;
  data?: Record<string, unknown>;
  error?: string;
}

const DEFAULT_MODE: 'sandbox' | 'production' =
  process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';

export function useCashfreePayment() {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const cashfreeInstanceRef = useRef<{ mode: 'sandbox' | 'production'; instance: any } | null>(null);

  const getCashfreeInstance = useCallback(async (mode: 'sandbox' | 'production') => {
    if (cashfreeInstanceRef.current && cashfreeInstanceRef.current.mode === mode) {
      return cashfreeInstanceRef.current.instance;
    }
    const instance = await load({ mode });
    cashfreeInstanceRef.current = { mode, instance };
    return instance;
  }, []);

  const startPayment = useCallback(
    async (payload: CashfreePaymentPayload): Promise<CashfreePaymentResult> => {
      if (!firebaseUser || !user) {
        toast({
          variant: 'destructive',
          title: 'Sign in required',
          description: 'Please sign in to continue with the payment.',
        });
        return { success: false, error: 'auth_required' };
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch('/api/payments/cashfree/intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to start payment.');
        }

        const mode: 'sandbox' | 'production' = data.cashfreeMode || DEFAULT_MODE;
        const cashfree = await getCashfreeInstance(mode);

        await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: '_modal',
        });

        const verifyResponse = await fetch('/api/payments/cashfree/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ orderId: data.orderId }),
        });

        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Failed to verify payment.');
        }

        return { success: true, status: verifyData.status, data: verifyData.data };
      } catch (error: any) {
        const message: string = error?.message || 'Payment failed. Please try again.';
        const isCancelled = message.toLowerCase().includes('cancel');

        toast({
          variant: isCancelled ? 'default' : 'destructive',
          title: isCancelled ? 'Payment cancelled' : 'Payment error',
          description: message,
        });

        return { success: false, error: message };
      }
    },
    [firebaseUser, user, toast, getCashfreeInstance]
  );

  return { startPayment };
}
