
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { EconomySettings } from '@/lib/types';

export async function getEconomySettingsAction(): Promise<EconomySettings | null> {
    const { db } = await getFirebaseAdmin();
    if (!db) return null;

    try {
        const docRef = db.doc('app-settings/economy');
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data() as EconomySettings;
        }
        // If it doesn't exist, create it with default values
        const defaultSettings: EconomySettings = {
            rewardForGameWin: 50,
            costForAITask: 10,
            coinsPerRupee: 100, // 100 coins = 1 Rupee
            signupBonus: 100,
            referralBonus: 200,
        };
        await docRef.set(defaultSettings);
        return defaultSettings;

    } catch (error) {
        console.error("Error fetching economy settings:", error);
        return null;
    }
}

export async function simulateEarningAction(idToken: string, points: number, description: string) {
    const { auth, db } = await getFirebaseAdmin();
    if (!auth || !db || !idToken || !points || !description) {
        return { success: false, error: 'Invalid parameters provided.' };
    }

    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;
        const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);
        const transactionRef = db.collection(`users/${userId}/transactions`).doc();

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userProfileRef);
            if (!userDoc.exists) {
                throw new Error("User profile does not exist.");
            }

            // Increment both wallet balance and lifetime points
            transaction.update(userProfileRef, {
                'wallet.knowledgeCoins': FieldValue.increment(points),
                'knowledgePoints': FieldValue.increment(points),
            });

            // Create a record of the transaction
            transaction.set(transactionRef, {
                description: description,
                points: points,
                transactionType: 'earn',
                createdAt: FieldValue.serverTimestamp(),
            });
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error in simulateEarningAction:', error);
        return { success: false, error: error.message || 'An unknown error occurred.' };
    }
}
