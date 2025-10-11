
'use server';

import { z } from 'zod';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin-new';
import { GenerateCreativeTasksInputSchema, generateCreativeTasks } from '@/ai/flows/generate-creative-tasks';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const generateTaskActionSchema = GenerateCreativeTasksInputSchema.extend({
    idToken: z.string(),
});

type GenerateTaskState = {
    task?: Awaited<ReturnType<typeof generateCreativeTasks>>;
    error?: string;
    errors?: Record<string, string[]>;
};


export async function generateTaskAction(prevState: any, data: FormData): Promise<GenerateTaskState> {
  const auth = getAdminAuth();
  const db = getAdminDb();
  
  const formValues = {
    idToken: data.get('idToken'),
    topic: data.get('topic'),
    taskType: data.get('taskType'),
    gradeLevel: data.get('gradeLevel'),
    assets: data.get('assets'),
  };

  const validatedFields = generateTaskActionSchema.safeParse(formValues);

  if (!validatedFields.success) {
    return { error: 'Invalid form data.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { idToken, ...taskInput } = validatedFields.data;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userRef = db.doc(`users/${uid}/profile/${uid}`);
    const economySettingsRef = db.doc('app-settings/economy');

    const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const economySettingsDoc = await transaction.get(economySettingsRef);

        if (!userDoc.exists) throw new Error('User profile not found.');
        
        const wallet = userDoc.data()?.wallet || { knowledgeCoins: 0 };
        const costForAITask = economySettingsDoc.data()?.costForAITask || 10;

        if (wallet.knowledgeCoins < costForAITask) {
            return { error: 'Insufficient Knowledge Coins.' };
        }

        const aiResponse = await generateCreativeTasks(taskInput);

        const newBalance = wallet.knowledgeCoins - costForAITask;
        transaction.update(userRef, { 'wallet.knowledgeCoins': newBalance });

        const transactionRef = userRef.collection('transactions').doc();
        transaction.set(transactionRef, {
            description: 'AI Task Generation',
            points: -costForAITask,
            transactionType: 'spend',
            createdAt: FieldValue.serverTimestamp(),
        });

        return { task: aiResponse };
    });

    if (result && 'error' in result) {
        return { error: result.error };
    }

    return { task: result?.task };

  } catch (error: any) {
    console.error('Error in generateTaskAction:', error);
    return { error: error.message || 'Failed to generate task.' };
  }
}


export async function awardDailySessionPointsAction(idToken: string) {
    const auth = getAdminAuth();
    const db = getAdminDb();
  
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userRef = db.doc(`users/${uid}/profile/${uid}`);
      const economySettingsRef = db.doc('app-settings/economy');
  
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const economySettingsDoc = await transaction.get(economySettingsRef);
  
        if (!userDoc.exists) {
          throw new Error('User profile not found.');
        }
  
        // Check for recent daily bonus
        const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
        const recentBonusQuery = userRef.collection('transactions')
          .where('description', '==', 'Daily Session Bonus')
          .where('createdAt', '>=', twentyFourHoursAgo)
          .limit(1);
        
        const recentBonusSnapshot = await transaction.get(recentBonusQuery);
        if (!recentBonusSnapshot.empty) {
          throw new Error('Daily bonus already claimed within the last 24 hours.');
        }
  
        const wallet = userDoc.data()?.wallet || { knowledgeCoins: 0 };
        const rewardForGameWin = economySettingsDoc.data()?.rewardForGameWin || 50;
  
        const newBalance = wallet.knowledgeCoins + rewardForGameWin;
        transaction.update(userRef, { 'wallet.knowledgeCoins': newBalance });
  
        const transactionRef = userRef.collection('transactions').doc();
        transaction.set(transactionRef, {
          description: 'Daily Session Bonus',
          points: rewardForGameWin,
          transactionType: 'earn',
          createdAt: FieldValue.serverTimestamp(),
        });
  
        return { newBalance };
      });
  
      return { success: true, newBalance: result.newBalance };
  
    } catch (error: any) {
        console.error('Error awarding daily points:', error);
        return { success: false, error: error.message || 'Failed to award points.' };
    }
}
