
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export async function toggleLessonCompletionAction(
  userId: string,
  courseId: string,
  lessonId: string,
  isCompleted: boolean
) {
  if (!userId || !courseId || !lessonId) {
    return { success: false, error: 'Invalid input' };
  }
  const { db } = await getFirebaseAdmin();
  if (!db) {
    return { success: false, error: 'Database not initialized' };
  }
  
  const enrollmentRef = db.doc(`users/${userId}/enrollments/${courseId}`);

  try {
    // We will use a simple chapter ID "main" for now. This can be expanded later.
    const lessonPath = `progress.chapters.main.lessons.${lessonId}.completed`;
    
    await enrollmentRef.update({
      [lessonPath]: isCompleted,
    });
    
    // In a real app, you would recalculate overall progress here.
    // For simplicity, we will skip that for now.

    revalidatePath(`/my-classes/${courseId}`);
    return { success: true };
  } catch (error: any) {
    const permissionError = new FirestorePermissionError({
        path: enrollmentRef.path,
        operation: 'update',
        requestResourceData: { progress: { chapters: { main: { lessons: { [lessonId]: { completed: isCompleted } } } } } },
        auth: { uid: userId },
    });
    errorEmitter.emit('permission-error', permissionError);
    return { success: false, error: error.message };
  }
}

export async function updateLastAccessedAction(userId: string, courseId: string) {
    if (!userId || !courseId) return;

    const { db } = await getFirebaseAdmin();
    if (!db) {
        console.error("Database not initialized for updateLastAccessedAction");
        return;
    }

    const enrollmentRef = db.doc(`users/${userId}/enrollments/${courseId}`);
    try {
        await enrollmentRef.set({
            lastAccessed: FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        // We can ignore this error as it's not critical for the user experience
        console.error("Failed to update last accessed time:", error);
    }
}
