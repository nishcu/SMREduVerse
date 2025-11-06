
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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
  bio: z.string().max(160, 'Bio must be 160 characters or less.').optional().or(z.literal('')),
  avatarUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  grade: z.string().optional().or(z.literal('')),
  school: z.string().optional().or(z.literal('')),
  educationHistory: z.array(EducationHistorySchema).optional(),
  syllabus: z.string().optional().or(z.literal('')),
  medium: z.string().optional().or(z.literal('')),
  interests: z.array(z.string()).optional(),
  sports: z.array(z.string()).optional(),
});

export async function updateUserProfileAction(prevState: any, formData: FormData) {
  const auth = getAdminAuth();
  const db = getAdminDb();

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
    bio: formData.get('bio') || '',
    avatarUrl: formData.get('avatarUrl') || '',
    grade: formData.get('grade') || '',
    school: formData.get('school') || '',
    syllabus: formData.get('syllabus') || '',
    medium: formData.get('medium') || '',
    interests,
    sports,
    educationHistory: educationHistoryData,
  };
  
  // Validate with conditional avatarUrl check
  let validatedFields: any;
  let profileData: any;
  let idToken: string;
  
  if (!formValues.avatarUrl || formValues.avatarUrl.trim() === '') {
    // Remove avatarUrl from validation if empty
    const { avatarUrl, ...rest } = formValues;
    validatedFields = UpdateProfileSchema.omit({ avatarUrl: true }).safeParse(rest);
    
    if (!validatedFields.success) {
      console.error(validatedFields.error.flatten().fieldErrors);
      return { error: 'Invalid form data.', errors: validatedFields.error.flatten().fieldErrors };
    }
    
    const result = validatedFields.data;
    idToken = result.idToken;
    profileData = { ...result, avatarUrl: '' }; // Set to empty string
  } else {
    validatedFields = UpdateProfileSchema.safeParse(formValues);
    
    if (!validatedFields.success) {
      console.error(validatedFields.error.flatten().fieldErrors);
      return { error: 'Invalid form data.', errors: validatedFields.error.flatten().fieldErrors };
    }
    
    const result = validatedFields.data;
    idToken = result.idToken;
    profileData = { ...result };
    delete profileData.idToken;
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Check if username is unique (excluding the current user)
    const usernameQuery = await db.collectionGroup('profile').where('username', '==', profileData.username).get();
    const existingUser = usernameQuery.docs.find(doc => doc.id !== uid);
    if (existingUser) {
        return { error: 'Username is already taken. Please choose another one.' };
    }

    const userRef = db.doc(`users/${uid}/profile/${uid}`);
    
    // Check if document exists
    const docSnap = await userRef.get();
    
    // Prepare data to update
    const dataToUpdate: any = {
        name: profileData.name,
        username: profileData.username,
        bio: profileData.bio || '',
        avatarUrl: profileData.avatarUrl || '',
        grade: profileData.grade || '',
        school: profileData.school || '',
        syllabus: profileData.syllabus || '',
        medium: profileData.medium || '',
        educationHistory: profileData.educationHistory || [],
        interests: profileData.interests || [],
        sports: profileData.sports || [],
    };

    // Always use set with merge to avoid Failed_Precondition errors
    // This works whether document exists or not, and preserves existing fields
    if (!docSnap.exists) {
        // Document doesn't exist, create it with all required fields
        await userRef.set({
            ...dataToUpdate,
            id: uid,
            email: decodedToken.email || '',
            followersCount: docSnap.data()?.followersCount || 0,
            followingCount: docSnap.data()?.followingCount || 0,
            knowledgePoints: docSnap.data()?.knowledgePoints || 0,
            wallet: docSnap.data()?.wallet || { knowledgeCoins: 0 },
            settings: docSnap.data()?.settings || {
                restrictSpending: false,
                restrictChat: false,
                restrictTalentHub: false,
            },
            createdAt: docSnap.data()?.createdAt || FieldValue.serverTimestamp(),
        }, { merge: true });
    } else {
        // Document exists, use set with merge to update only specified fields
        // This prevents Failed_Precondition errors and preserves existing fields
        await userRef.set(dataToUpdate, { merge: true });
    }
    
    revalidatePath(`/profile/${uid}`);
    return { success: true, data: dataToUpdate };

  } catch (error: any) {
    return { error: error.message || 'Failed to update profile.' };
  }
}
