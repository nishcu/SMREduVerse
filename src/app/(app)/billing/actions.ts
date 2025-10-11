
'use server';

import type { SubscriptionPlan, CoinBundle } from '@/lib/types';
import { getAdminDb } from '@/lib/firebase-admin-new';


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
