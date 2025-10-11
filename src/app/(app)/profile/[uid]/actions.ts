'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { EducationHistory } from '@/lib/types';

const EducationHistorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Institution name is required.'),
    level: z.string().min(1, 'Level/Degree is required.'),
    startYear: z.string().min(4, 'Invalid year.').max(4, 'Invalid year.'),
    endYear: z.string().min(4, 'Invalid year.').max(4, 'Invalid year,'),
});

const UpdateProfileSchema = z.object({
  idToken: z.string(),
  name: z.string().min(1, 'Name cannot be empty.'),
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional(),
  avatarUrl: z.string().url('Please enter a valid URL.').optional(),
  grade: z.string().optional(),
  school: z.string().optional(),
  educationHistory: z.array(EducationHistorySchema).optional(),
  syllabus: z.string().optional(),
  medium: z.string().optional(),
  interests: z.array(z.string()).optional(),
  sports: z.array(z.string()).optional(),
});

export async function updateUserProfileAction(prevState: any, formData: FormData) {
  const { auth, db } = getFirebaseAdmin();
  if (!auth || !db) {
    return { success: false, error: 'Server configuration error.' };
  }

  const interests = formData.getAll('interests[]');
  const sports = formData.getAll('sports[]');
  
  const educationHistoryData = formData.getAll('educationHistory').map(entry => {
    try {
        const parsed = JSON.parse(entry as string);
        // Ensure id is a string
        if (parsed.id === undefined || parsed.id === null) {
            parsed.id = Math.random().toString(36).substring(2, 15);
        } else {
            parsed.id = String(parsed.id);
        }
        return parsed;
    } catch (e) {
        return null;
    }
  }).filter(Boolean) as EducationHistory[];
  
  const formValues = {
    idToken: formData.get('idToken'),
    name: formData.get('name'),
    username: formData.get('username'),
    bio: formData.get('bio'),
    avatarUrl: formData.get('avatarUrl'),
    grade: formData.get('grade'),
    school: formData.get('school'),
    syllabus: formData.get('syllabus'),
    medium: formData.get('medium'),
    interests,
    sports,
    educationHistory: educationHistoryData,
  };

  const validatedFields = UpdateProfileSchema.safeParse(formValues);

  if (!validatedFields.success) {
    console.error(validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid form data.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  const { idToken, ...profileData } = validatedFields.data;

  try {
    const decodedToken = await auth.verifyIdToken(idToken as string);
    const uid = decodedToken.uid;
    
    // Check if username is unique (excluding the current user)
    const usernameQuery = await db.collectionGroup('profile').where('username', '==', profileData.username).get();
    const existingUser = usernameQuery.docs.find(doc => doc.id !== uid);
    if (existingUser) {
        return { error: 'Username is already taken. Please choose another one.' };
    }

    const userRef = db.doc(`users/${uid}/profile/${uid}`);
    
    // Ensure educationHistory is an array, even if it's empty
    const dataToUpdate = {
        ...profileData,
        educationHistory: profileData.educationHistory || []
    };

    await userRef.update(dataToUpdate);
    
    revalidatePath(`/profile/${uid}`);
    return { success: true, data: profileData };

  } catch (error: any) {
    return { error: error.message || 'Failed to update profile.' };
  }
}
