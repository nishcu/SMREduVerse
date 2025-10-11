
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const questActionSchema = z.object({
  idToken: z.string().min(1, 'Authentication token is required'),
  questId: z.string().min(1, 'Quest ID is required').optional(), // Optional for reset
});

export async function completeQuestAction(prevState: any, formData: FormData) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    
    const validatedFields = questActionSchema.safeParse({
      idToken: formData.get('idToken'),
      questId: formData.get('questId'),
    });

    if (!validatedFields.success) {
      console.error('completeQuestAction: Validation failed', validatedFields.error);
      return { success: false, error: 'Invalid data provided: ' + validatedFields.error.message };
    }

    const { idToken, questId } = validatedFields.data;

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const progressRef = db.doc(`users/${uid}/quest-progress/main`);
    const questData = { completedQuests: FieldValue.arrayUnion(questId) };

    await progressRef.set(questData, { merge: true });

    revalidatePath('/brain-quest');
    return { success: true };
  } catch (error: any) {
    console.error('completeQuestAction: Error completing quest for user', { error: error.message, stack: error.stack });
    return { 
      success: false, 
      error: error.message || 'Failed to complete quest. Please try again.' 
    };
  }
}

export async function resetProgressAction(prevState: any, formData: FormData) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    
    const validatedFields = questActionSchema.omit({ questId: true }).safeParse({
      idToken: formData.get('idToken'),
    });

    if (!validatedFields.success) {
      console.error('resetProgressAction: Validation failed', validatedFields.error);
      return { success: false, error: 'Invalid data provided: ' + validatedFields.error.message };
    }

    const { idToken } = validatedFields.data;

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const progressRef = db.doc(`users/${uid}/quest-progress/main`);
    const resetData = { completedQuests: [] };

    await progressRef.set(resetData, { merge: true });
    
    revalidatePath('/brain-quest');
    return { success: true };
  } catch (error: any) {
    console.error('resetProgressAction: Error resetting progress for user', { error: error.message, stack: error.stack });
    return { 
      success: false, 
      error: error.message || 'Failed to reset progress. Please try again.' 
    };
  }
}
