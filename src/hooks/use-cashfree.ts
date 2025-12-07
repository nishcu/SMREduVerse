'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type CashfreeMode = 'sandbox' | 'production';

const DEFAULT_MODE: CashfreeMode =
  (process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production' ? 'production' : 'sandbox');

const SDK_URL: Record<CashfreeMode, string> = {
  sandbox: 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js',
  production: 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js',
};

export function useCashfree(mode: CashfreeMode = DEFAULT_MODE) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instanceRef = useRef<CashfreeInstance | null>(null);

  useEffect(() => {
    setIsReady(false);
    setError(null);

    if (typeof window === 'undefined') {
      return;
    }

    const initializeInstance = () => {
      if (typeof window === 'undefined' || typeof window.Cashfree !== 'function') {
        setError('Cashfree SDK is not available in this environment.');
        return;
      }

      try {
        instanceRef.current = window.Cashfree({ mode });
        setIsReady(true);
      } catch (sdkError: any) {
        console.error('Cashfree SDK initialization failed:', sdkError);
        setError('Failed to initialize Cashfree SDK.');
      }
    };

    const existingScript = document.querySelector<HTMLScriptElement>(`script[data-cashfree-sdk="${mode}"]`);

    if (existingScript) {
      if (instanceRef.current) {
        setIsReady(true);
      } else {
        initializeInstance();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = SDK_URL[mode];
    script.async = true;
    script.defer = true;
    script.dataset.cashfreeSdk = mode;
    script.onload = initializeInstance;
    script.onerror = () => {
      setError('Unable to load Cashfree payment SDK.');
    };

    document.body.appendChild(script);

    return () => {
      // We intentionally keep the script in the DOM for reuse.
    };
  }, [mode]);

  const openCheckout = useCallback(async (paymentSessionId: string, redirectTarget?: CashfreeCheckoutOptions['redirectTarget']) => {
    if (!instanceRef.current) {
      throw new Error('Cashfree SDK is not ready yet. Please try again in a moment.');
    }

    return instanceRef.current.checkout({
      paymentSessionId,
      redirectTarget: redirectTarget ?? '_modal',
    });
  }, []);

  return {
    isReady,
    error,
    openCheckout,
  };
}
