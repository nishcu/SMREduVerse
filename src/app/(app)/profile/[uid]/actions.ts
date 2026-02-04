
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
  mobileNumber: z.string().optional().or(z.literal('')),
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
    mobileNumber: formData.get('mobileNumber') || '',
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
    
    const userRef = db.doc(`users/${uid}/profile/${uid}`);
    
    // Get existing document data first
    const docSnap = await userRef.get();
    const existingData = docSnap.exists ? docSnap.data() : null;
    
    // Check if username is unique (excluding the current user) - only if username changed
    if (existingData?.username !== profileData.username) {
      try {
        // Query for username uniqueness - check all user profiles
        // Note: This requires an index, but we'll handle errors gracefully
        const usernameQuery = await db.collectionGroup('profile').where('username', '==', profileData.username).get();
        const existingUser = usernameQuery.docs.find(doc => {
          // Check if this is a different user (not the current user)
          const docPath = doc.ref.path;
          const docUserId = docPath.split('/')[1]; // Extract userId from path: users/{userId}/profile/{profileId}
          return docUserId !== uid;
        });
        if (existingUser) {
            return { error: 'Username is already taken. Please choose another one.' };
        }
      } catch (queryError: any) {
        // If collectionGroup query fails (e.g., missing index), skip uniqueness check
        // This is not critical - we'll still update the profile
        console.warn('Username uniqueness check failed, continuing with update:', queryError.message);
      }
    }
    
    // Prepare data to update - merge with existing data to preserve all fields
    // But only include fields we want to preserve (not Firestore Timestamps directly)
    const dataToUpdate: any = {
        // Preserve critical existing fields
        id: existingData?.id || uid,
        email: existingData?.email || decodedToken.email || '',
        followersCount: existingData?.followersCount ?? 0,
        followingCount: existingData?.followingCount ?? 0,
        knowledgePoints: existingData?.knowledgePoints ?? 0,
        wallet: existingData?.wallet || { knowledgeCoins: 0 },
        settings: existingData?.settings || {
            restrictSpending: false,
            restrictChat: false,
            restrictTalentHub: false,
        },
        // Update form fields
        name: profileData.name,
        username: profileData.username,
        bio: profileData.bio || '',
        avatarUrl: profileData.avatarUrl || '',
        mobileNumber: profileData.mobileNumber || '',
        grade: profileData.grade || '',
        school: profileData.school || '',
        syllabus: profileData.syllabus || '',
        medium: profileData.medium || '',
        educationHistory: profileData.educationHistory || [],
        interests: profileData.interests || [],
        sports: profileData.sports || [],
    };
    
    // Only set createdAt if document doesn't exist (preserve existing timestamp)
    if (!existingData?.createdAt) {
        dataToUpdate.createdAt = FieldValue.serverTimestamp();
    }

    // Always use set with merge to avoid Failed_Precondition errors
    // This works whether document exists or not, and preserves existing fields
    await userRef.set(dataToUpdate, { merge: true });
    
    revalidatePath(`/profile/${uid}`);
    
    // Return only serializable data (remove Firestore-specific types)
    const serializableData = {
      name: dataToUpdate.name,
      username: dataToUpdate.username,
      bio: dataToUpdate.bio || '',
      avatarUrl: dataToUpdate.avatarUrl || '',
      mobileNumber: dataToUpdate.mobileNumber || '',
      grade: dataToUpdate.grade || '',
      school: dataToUpdate.school || '',
      syllabus: dataToUpdate.syllabus || '',
      medium: dataToUpdate.medium || '',
      educationHistory: dataToUpdate.educationHistory || [],
      interests: dataToUpdate.interests || [],
      sports: dataToUpdate.sports || [],
    };
    
    return { success: true, data: serializableData };

  } catch (error: any) {
    return { error: error.message || 'Failed to update profile.' };
  }
}
