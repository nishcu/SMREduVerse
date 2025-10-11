
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const StudyRoomSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty.').max(100, 'Name must be 100 characters or less.'),
  description: z.string().min(1, 'Description cannot be empty.').max(500, 'Description must be 500 characters or less.'),
  subject: z.string().min(1, 'Please select a subject.'),
  roomType: z.enum(['chat', 'video', 'audio']),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid schedule date.' }),
  idToken: z.string().min(1, 'Authentication token is required.'),
});

type ActionResult = {
  success: boolean;
  error?: string | null;
  errors?: Record<string, string[]> | null;
  roomId?: string;
};

export async function createStudyRoomAction(prevState: any, formData: FormData): Promise<ActionResult> {
  const { auth, db } = getFirebaseAdmin();

  if (!auth || !db) {
    return {
      success: false,
      error: 'Firebase Admin SDK not initialized.',
    };
  }

  const validatedFields = StudyRoomSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    subject: formData.get('subject'),
    roomType: formData.get('roomType'),
    scheduledAt: formData.get('scheduledAt'),
    idToken: formData.get('idToken'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { idToken, ...roomData } = validatedFields.data;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userProfileSnap = await db.collection('users').doc(uid).collection('profile').limit(1).get();
    if (userProfileSnap.empty) {
        throw new Error('User profile not found.');
    }
    const userProfile = userProfileSnap.docs[0].data();

    const scheduledTimestamp = Timestamp.fromDate(new Date(roomData.scheduledAt));

    const roomPayload = {
      ...roomData,
      hostId: uid,
      hostName: userProfile.name || 'Anonymous',
      participantCount: 0,
      status: scheduledTimestamp.toMillis() <= Date.now() ? 'live' : 'upcoming',
      scheduledAt: scheduledTimestamp,
      createdAt: FieldValue.serverTimestamp(),
      imageUrl: `https://picsum.photos/seed/${Math.random()}/600/400`, // random placeholder
    };

    const roomRef = await db.collection('study-rooms').add(roomPayload);

    revalidatePath('/study-rooms');

    return { success: true, roomId: roomRef.id };

  } catch (error: any) {
    console.error('Error creating study room:', error);
    return {
      success: false,
      error: 'Failed to create room: ' + (error.message || 'Unknown error'),
    };
  }
}
