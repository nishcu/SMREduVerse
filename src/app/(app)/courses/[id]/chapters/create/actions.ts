
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const ChapterSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description cannot be empty.').max(500, 'Description must be 500 characters or less.'),
  idToken: z.string().min(1, 'Authentication token is required.'),
  courseId: z.string().min(1, 'Course ID is required.'),
});

type ChapterFormValues = z.infer<typeof ChapterSchema>;

type ActionResult = {
  success: boolean;
  error?: string | null;
  chapterId?: string;
};

export async function createChapterAction(data: ChapterFormValues): Promise<ActionResult> {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const { idToken, courseId, ...chapterData } = data;

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const courseRef = db.collection('courses').doc(courseId);
    const courseSnap = await courseRef.get();

    if (!courseSnap.exists) {
      return { success: false, error: 'Course not found.' };
    }

    const courseData = courseSnap.data();
    if (courseData?.instructorId !== uid) {
      return { success: false, error: 'You are not authorized to add chapters to this course.' };
    }

    const chaptersCollectionRef = courseRef.collection('chapters');
    const chapterCountSnapshot = await chaptersCollectionRef.count().get();
    const newOrder = chapterCountSnapshot.data().count + 1;

    const chapterPayload = {
      ...chapterData,
      order: newOrder,
      createdAt: FieldValue.serverTimestamp(),
    };

    const chapterRef = await chaptersCollectionRef.add(chapterPayload);

    revalidatePath(`/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseId}`);

    return { success: true, chapterId: chapterRef.id };

  } catch (error: any) {
    console.error('Error creating chapter:', error);
    return {
      success: false,
      error: 'Failed to create chapter: ' + (error.message || 'Unknown error'),
    };
  }
}
