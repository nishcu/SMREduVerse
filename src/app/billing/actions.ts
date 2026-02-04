
'use server';

import type { SubscriptionPlan, CoinBundle } from '@/lib/types';
import { getAdminDb } from '@/lib/firebase-admin';


export async function getSubscriptionPlansAction(): Promise<SubscriptionPlan[]> {
    const db = getAdminDb();
    try {
        const snapshot = await db.collection('app-settings/monetization/subscription-plans').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
    } catch (error) {
        console.error("Error fetching subscription plans: ", error);
        return [];
    }
}

export async function getCoinBundlesAction(): Promise<CoinBundle[]> {
    const db = getAdminDb();
    try {
        const snapshot = await db.collection('app-settings/monetization/coin-bundles').orderBy('coins', 'asc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoinBundle));
    } catch (error) {
        console.error("Error fetching coin bundles: ", error);
        return [];
    }
}
