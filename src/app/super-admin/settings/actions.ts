
'use server';

import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { EconomySettings } from '@/lib/types';

const EconomySettingsSchema = z.object({
  // Earning
  rewardForGameWin: z.coerce.number().min(0),
  rewardForPostCreation: z.coerce.number().min(0),
  rewardForCourseCompletion: z.coerce.number().min(0),
  signupBonus: z.coerce.number().min(0),
  referralBonus: z.coerce.number().min(0),
  
  // Spending
  costForAITask: z.coerce.number().min(0),

  // Conversion & Commission
  coinsPerRupee: z.coerce.number().min(1),
  platformFeePercent: z.coerce.number().min(0).max(100),
});

export async function getEconomySettingsAction(): Promise<EconomySettings | null> {
    const db = getAdminDb();

    try {
        const docRef = db.doc('app-settings/economy');
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data() as EconomySettings;
        }
        // If it doesn't exist, create it with default values
        const defaultSettings: EconomySettings = {
            rewardForGameWin: 50,
            rewardForPostCreation: 5,
            rewardForCourseCompletion: 100,
            signupBonus: 100,
            referralBonus: 200,
            costForAITask: 10,
            coinsPerRupee: 100,
            platformFeePercent: 15,
        };
        await docRef.set(defaultSettings);
        return defaultSettings;

    } catch (error) {
        console.error("Error fetching economy settings:", error);
        return null;
    }
}


export async function saveEconomySettingsAction(prevState: any, formData: FormData) {
    const db = getAdminDb();

    const validatedFields = EconomySettingsSchema.safeParse({
        rewardForGameWin: formData.get('rewardForGameWin'),
        rewardForPostCreation: formData.get('rewardForPostCreation'),
        rewardForCourseCompletion: formData.get('rewardForCourseCompletion'),
        signupBonus: formData.get('signupBonus'),
        referralBonus: formData.get('referralBonus'),
        costForAITask: formData.get('costForAITask'),
        coinsPerRupee: formData.get('coinsPerRupee'),
        platformFeePercent: formData.get('platformFeePercent'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            error: 'Invalid data provided.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const docRef = db.doc('app-settings/economy');
        await docRef.set(validatedFields.data, { merge: true });
        revalidatePath('/super-admin/settings');
        return { success: true, data: validatedFields.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
