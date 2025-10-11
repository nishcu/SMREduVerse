
'use server';

import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import type { SubscriptionPlan, CoinBundle } from '@/lib/types';

// Schemas for validation
const PlanSchema = z.object({
    name: z.string().min(1, 'Plan name is required'),
    price: z.string().min(1, 'Price is required'),
    pricePeriod: z.string().min(1, 'Price period is required'),
    features: z.array(z.string()).min(1, 'At least one feature is required'),
    isPopular: z.boolean(),
});

const BundleSchema = z.object({
    coins: z.coerce.number().min(1, 'Coins must be greater than 0'),
    price: z.string().min(1, 'Price is required'),
    isPopular: z.boolean(),
});

// Subscription Plan Actions
export async function getSubscriptionPlansAction(): Promise<SubscriptionPlan[]> {
    const db = getAdminDb();
    const snapshot = await db.collection('app-settings/monetization/subscription-plans').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
}

export async function saveSubscriptionPlanAction(prevState: any, formData: FormData) {
    const db = getAdminDb();

    const id = formData.get('id') as string | null;
    const features = formData.getAll('features').map(String).filter(f => f.trim() !== '');

    const validatedFields = PlanSchema.safeParse({
        name: formData.get('name'),
        price: formData.get('price'),
        pricePeriod: formData.get('pricePeriod'),
        isPopular: formData.get('isPopular') === 'on',
        features,
    });

    if (!validatedFields.success) {
        return { success: false, error: 'Invalid data.', errors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        if (id) {
            await db.doc(`app-settings/monetization/subscription-plans/${id}`).set(validatedFields.data, { merge: true });
        } else {
            await db.collection('app-settings/monetization/subscription-plans').add(validatedFields.data);
        }
        revalidatePath('/super-admin/monetization');
        revalidatePath('/billing');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteSubscriptionPlanAction(id: string) {
    const db = getAdminDb();
    try {
        await db.doc(`app-settings/monetization/subscription-plans/${id}`).delete();
        revalidatePath('/super-admin/monetization');
        revalidatePath('/billing');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


// Coin Bundle Actions
export async function getCoinBundlesAction(): Promise<CoinBundle[]> {
    const db = getAdminDb();
    const snapshot = await db.collection('app-settings/monetization/coin-bundles').orderBy('coins', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoinBundle));
}


export async function saveCoinBundleAction(prevState: any, formData: FormData) {
    const db = getAdminDb();

    const id = formData.get('id') as string | null;
    
    const validatedFields = BundleSchema.safeParse({
        coins: formData.get('coins'),
        price: formData.get('price'),
        isPopular: formData.get('isPopular') === 'on',
    });

    if (!validatedFields.success) {
        return { success: false, error: 'Invalid data.', errors: validatedFields.error.flatten().fieldErrors };
    }
    
    try {
        if (id) {
            await db.doc(`app-settings/monetization/coin-bundles/${id}`).set(validatedFields.data, { merge: true });
        } else {
            await db.collection('app-settings/monetization/coin-bundles').add(validatedFields.data);
        }
        revalidatePath('/super-admin/monetization');
        revalidatePath('/billing');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteCoinBundleAction(id: string) {
    const db = getAdminDb();
    try {
        await db.doc(`app-settings/monetization/coin-bundles/${id}`).delete();
        revalidatePath('/super-admin/monetization');
        revalidatePath('/billing');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
