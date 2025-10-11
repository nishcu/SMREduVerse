
'use server';

import { getAdminDb } from '@/lib/firebase-admin-new';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

export async function toggleLessonCompletionAction(
  userId: string,
  courseId: string,
  lessonId: string,
  isCompleted: boolean
) {
  if (!userId || !courseId || !lessonId) {
    return { success: false, error: 'Invalid input' };
  }
  const db = getAdminDb();
  
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
    console.error('Error toggling lesson completion:', error);
    return { success: false, error: error.message };
  }
}

export async function updateLastAccessedAction(userId: string, courseId: string) {
    if (!userId || !courseId) return;

    const db = getAdminDb();

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
