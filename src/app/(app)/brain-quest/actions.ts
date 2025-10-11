'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

// Schema for validating quest-related form data
const questActionSchema = z.object({
  idToken: z.string().min(1, 'Authentication token is required'),
  questId: z.string().min(1, 'Quest ID is required').optional(), // Optional for reset
});

export async function completeQuestAction(prevState: any, formData: FormData) {
  try {
    // Initialize Firebase Admin SDK
    const { auth, db } = getFirebaseAdmin();
    if (!auth || !db) {
      console.error('completeQuestAction: Firebase Admin SDK not initialized');
      return { success: false, error: 'Server configuration error: Firebase services unavailable' };
    }

    // Validate form data
    const validatedFields = questActionSchema.safeParse({
      idToken: formData.get('idToken'),
      questId: formData.get('questId'),
    });

    if (!validatedFields.success) {
      console.error('completeQuestAction: Validation failed', validatedFields.error);
      return { success: false, error: 'Invalid data provided: ' + validatedFields.error.message };
    }

    const { idToken, questId } = validatedFields.data;

    // Verify ID token
    console.log('completeQuestAction: Verifying ID token for quest', { questId });
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log('completeQuestAction: Token verified, user:', uid);

    // Update quest progress
    const progressRef = db.doc(`users/${uid}/quest-progress/main`);
    const questData = { completedQuests: FieldValue.arrayUnion(questId) };

    await progressRef.set(questData, { merge: true });
    console.log('completeQuestAction: Quest progress updated for user', uid, 'quest', questId);

    // Revalidate the Brain Quest page
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
    // Initialize Firebase Admin SDK
    const { auth, db } = getFirebaseAdmin();
    if (!auth || !db) {
      console.error('resetProgressAction: Firebase Admin SDK not initialized');
      return { success: false, error: 'Server configuration error: Firebase services unavailable' };
    }

    // Validate form data (questId not needed for reset)
    const validatedFields = questActionSchema.omit({ questId: true }).safeParse({
      idToken: formData.get('idToken'),
    });

    if (!validatedFields.success) {
      console.error('resetProgressAction: Validation failed', validatedFields.error);
      return { success: false, error: 'Invalid data provided: ' + validatedFields.error.message };
    }

    const { idToken } = validatedFields.data;

    // Verify ID token
    console.log('resetProgressAction: Verifying ID token');
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log('resetProgressAction: Token verified, user:', uid);

    // Reset quest progress
    const progressRef = db.doc(`users/${uid}/quest-progress/main`);
    const resetData = { completedQuests: [] };

    await progressRef.set(resetData, { merge: true });
    console.log('resetProgressAction: Quest progress reset for user', uid);

    // Revalidate the Brain Quest page
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