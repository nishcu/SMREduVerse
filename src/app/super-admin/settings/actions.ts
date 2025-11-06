
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

  // Activity Participation Costs
  costToJoinChallenge: z.coerce.number().min(0),
  costToHostChallenge: z.coerce.number().min(0),
  costToJoinContest: z.coerce.number().min(0),
  costToHostContest: z.coerce.number().min(0),
  costToJoinStudyRoom: z.coerce.number().min(0),
  costToCreateStudyRoom: z.coerce.number().min(0),
  costToJoinGame: z.coerce.number().min(0),
  
  // Winner Rewards
  rewardForChallengeWin: z.coerce.number().min(0),
  rewardForChallengeSecond: z.coerce.number().min(0),
  rewardForChallengeThird: z.coerce.number().min(0),
  rewardForContestWin: z.coerce.number().min(0),
  rewardForContestSecond: z.coerce.number().min(0),
  rewardForContestThird: z.coerce.number().min(0),
  
  // Host Earnings Configuration
  hostEarningPercent: z.coerce.number().min(0).max(100),
  participantFeePercent: z.coerce.number().min(0).max(100),

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
            // Activity Participation Costs
            costToJoinChallenge: 50,
            costToHostChallenge: 200,
            costToJoinContest: 100,
            costToHostContest: 500,
            costToJoinStudyRoom: 10,
            costToCreateStudyRoom: 50,
            costToJoinGame: 20,
            // Winner Rewards
            rewardForChallengeWin: 100,
            rewardForChallengeSecond: 50,
            rewardForChallengeThird: 25,
            rewardForContestWin: 500,
            rewardForContestSecond: 250,
            rewardForContestThird: 100,
            // Host Earnings Configuration
            hostEarningPercent: 15, // Host earns 15% of participant fees
            participantFeePercent: 15, // 15% of entry fee goes to host, rest to prize pool
            // Conversion & Commission
            coinsPerRupee: 100,
            platformFeePercent: 10, // Platform takes 10% commission on all earnings
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
        costToJoinChallenge: formData.get('costToJoinChallenge'),
        costToHostChallenge: formData.get('costToHostChallenge'),
        costToJoinContest: formData.get('costToJoinContest'),
        costToHostContest: formData.get('costToHostContest'),
        costToJoinStudyRoom: formData.get('costToJoinStudyRoom'),
        costToCreateStudyRoom: formData.get('costToCreateStudyRoom'),
        costToJoinGame: formData.get('costToJoinGame'),
        rewardForChallengeWin: formData.get('rewardForChallengeWin'),
        rewardForChallengeSecond: formData.get('rewardForChallengeSecond'),
        rewardForChallengeThird: formData.get('rewardForChallengeThird'),
        rewardForContestWin: formData.get('rewardForContestWin'),
        rewardForContestSecond: formData.get('rewardForContestSecond'),
        rewardForContestThird: formData.get('rewardForContestThird'),
        hostEarningPercent: formData.get('hostEarningPercent'),
        participantFeePercent: formData.get('participantFeePercent'),
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
