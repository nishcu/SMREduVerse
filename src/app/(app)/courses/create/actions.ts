
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const CourseSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description cannot be empty.').max(500, 'Description must be 500 characters or less.'),
  subject: z.string().min(1, 'Please select a subject.'),
  imageUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  duration: z.string().min(1, 'Duration is required.').max(50, 'Duration must be 50 characters or less.'),
  knowledgeCoins: z.coerce.number().min(0, 'Coins must be a positive number.'),
  startDate: z.date(),
  idToken: z.string().min(1, 'Authentication token is required.'),
});

type CourseFormValues = z.infer<typeof CourseSchema>;

type ActionResult = {
  success: boolean;
  error?: string | null;
  courseId?: string;
};

export async function createCourseAction(data: CourseFormValues): Promise<ActionResult> {
  const db = getAdminDb();
  const auth = getAdminAuth();

  try {
    const { idToken, ...courseData } = data;

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userProfileSnap = await db.collection('users').doc(uid).collection('profile').limit(1).get();
    
    let instructorName = 'Anonymous';
    if (!userProfileSnap.empty) {
      instructorName = userProfileSnap.docs[0].data()?.name || 'Anonymous';
    }


    const coursePayload = {
      ...courseData,
      startDate: Timestamp.fromDate(new Date(courseData.startDate)),
      instructorId: uid,
      instructorName: instructorName,
      enrollmentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    };

    const courseRef = await db.collection('courses').add(coursePayload);

    revalidatePath('/courses');
    return { success: true, courseId: courseRef.id };
  } catch (error: any) {
    console.error('Error creating course:', error);
    return {
      success: false,
      error: 'Failed to create course: ' + (error.message || 'Unknown error'),
    };
  }
}
