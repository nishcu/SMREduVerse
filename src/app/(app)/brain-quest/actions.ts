
'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const questActionSchema = z.object({
  idToken: z.string(),
  questId: z.string(),
});

export async function completeQuestAction(formData: FormData) {
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

    await progressRef.set({
        completedQuests: FieldValue.arrayUnion(questId)
    }, { merge: true });

    revalidatePath('/brain-quest');
    return { success: true };
  } catch (error: any) {
    const permissionError = new FirestorePermissionError({
        path: `users/${uid}/quest-progress/main`,
        operation: 'write',
        requestResourceData: { completedQuests: [questId] },
        auth: { uid },
    });
    errorEmitter.emit('permission-error', permissionError);
    return { success: false, error: error.message || 'Failed to complete quest.' };
  }
}

export async function resetProgressAction(formData: FormData) {
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
  
      await progressRef.set({
          completedQuests: []
      }, { merge: true });
  
      revalidatePath('/brain-quest');
      return { success: true };
    } catch (error: any)      {
      const permissionError = new FirestorePermissionError({
        path: `users/${uid}/quest-progress/main`,
        operation: 'write',
        requestResourceData: { completedQuests: [] },
        auth: { uid },
      });
      errorEmitter.emit('permission-error', permissionError);
      return { success: false, error: error.message || 'Failed to reset progress.' };
    }
  }

