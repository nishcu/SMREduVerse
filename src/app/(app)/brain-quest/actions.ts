'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue, doc } from 'firebase-admin/firestore';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const questActionSchema = z.object({
  idToken: z.string(),
  questId: z.string(),
});

export async function completeQuestAction(prevState: any, formData: FormData) {
  const { auth, db } = getFirebaseAdmin();
  if (!auth || !db) {
    return { success: false, error: 'Server configuration error.' };
  }

  const validatedFields = questActionSchema.safeParse({
    idToken: formData.get('idToken'),
    questId: formData.get('questId'),
  });

  if (!validatedFields.success) {
    return { success: false, error: 'Invalid data provided.' };
  }

  const { idToken, questId } = validatedFields.data;
  let uid;
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    uid = decodedToken.uid;
    const progressRef = db.doc(`users/${uid}/quest-progress/main`);
    
    const questData = { completedQuests: FieldValue.arrayUnion(questId) };

    await progressRef.set(questData, { merge: true }).catch(async (serverError: any) => {
        const permissionError = new FirestorePermissionError({
            path: progressRef.path,
            operation: 'update',
            requestResourceData: { questId },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        // Re-throw to be caught by the outer catch block
        throw permissionError;
    });

    revalidatePath('/brain-quest');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to complete quest.' };
  }
}

export async function resetProgressAction(prevState: any, formData: FormData) {
    const { auth, db } = getFirebaseAdmin();
    if (!auth || !db) {
      return { success: false, error: 'Server configuration error.' };
    }
  
    const idToken = formData.get('idToken') as string;
    if (!idToken) {
        return { success: false, error: 'Authentication token is missing.' };
    }
    let uid;
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      uid = decodedToken.uid;
      const progressRef = db.doc(`users/${uid}/quest-progress/main`);
      
      const resetData = { completedQuests: [] };
  
      await progressRef.set(resetData, { merge: true }).catch(async (serverError: any) => {
          const permissionError = new FirestorePermissionError({
            path: progressRef.path,
            operation: 'update',
            requestResourceData: resetData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
      });
  
      revalidatePath('/brain-quest');
      return { success: true };
    } catch (error: any)      {
        return { success: false, error: error.message || 'Failed to reset progress.' };
    }
  }
