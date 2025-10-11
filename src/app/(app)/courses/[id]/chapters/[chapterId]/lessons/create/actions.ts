
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const LessonSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description cannot be empty.').max(500, 'Description must be 500 characters or less.'),
  contentType: z.enum(['video', 'text', 'pdf', 'presentation']),
  contentUrl: z.string().url('Please enter a valid URL for the content.').optional().or(z.literal('')),
  idToken: z.string().min(1, 'Authentication token is required.'),
  courseId: z.string().min(1, 'Course ID is required.'),
  chapterId: z.string().min(1, 'Chapter ID is required.'),
});

type LessonFormValues = z.infer<typeof LessonSchema>;

type ActionResult = {
  success: boolean;
  error?: string | null;
  errors?: Record<string, string[]> | null;
};

export async function createLessonAction(prevState: any, data: LessonFormValues): Promise<ActionResult> {
  const { auth, db } = getFirebaseAdmin();

  if (!auth || !db) {
    return {
      success: false,
      error: 'Firebase Admin SDK not initialized.',
    };
  }

  const validatedFields = LessonSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { idToken, courseId, chapterId, ...lessonData } = validatedFields.data;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const courseRef = db.doc(`courses/${courseId}`);
    const courseSnap = await courseRef.get();

    if (!courseSnap.exists || courseSnap.data()?.instructorId !== uid) {
      return { success: false, error: 'You are not authorized to add lessons to this course.' };
    }
    
    const lessonsCollectionRef = courseRef.collection('chapters').doc(chapterId).collection('lessons');
    const lessonCountSnapshot = await lessonsCollectionRef.count().get();
    const newOrder = lessonCountSnapshot.data().count + 1;

    const lessonPayload = {
      ...lessonData,
      order: newOrder,
      createdAt: FieldValue.serverTimestamp(),
    };

    await lessonsCollectionRef.add(lessonPayload);

    revalidatePath(`/courses/${courseId}/chapters/${chapterId}/edit`);

    return { success: true };

  } catch (error: any) {
    console.error('Error creating lesson:', error);
    return {
      success: false,
      error: 'Failed to create lesson: ' + (error.message || 'Unknown error'),
    };
  }
}
