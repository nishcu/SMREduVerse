'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import type { ParentalControlSettings } from '@/lib/types';
import bcrypt from 'bcryptjs';

const ParentalControlSettingsSchema = z.object({
  restrictSpending: z.boolean(),
  restrictChat: z.boolean(),
  restrictTalentHub: z.boolean(),
  restrictAITasks: z.boolean(),
  restrictContests: z.boolean(),
  restrictMarketplace: z.boolean(),
  enableActivityLogs: z.boolean(),
  notificationInterval: z.number().min(15).max(1440), // 15 minutes to 24 hours
  parentalCode: z.string().min(4).max(10).optional(),
});

export async function saveParentalControlSettings(
  idToken: string,
  settings: z.infer<typeof ParentalControlSettingsSchema>
) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const validatedSettings = ParentalControlSettingsSchema.parse(settings);

    // Hash parental code if provided
    let hashedCode: string | undefined;
    if (validatedSettings.parentalCode) {
      hashedCode = await bcrypt.hash(validatedSettings.parentalCode, 10);
    }

    // Get existing settings
    const settingsRef = db.doc(`users/${uid}/parental-controls/settings`);
    const existingSettings = await settingsRef.get();

    const settingsData: Partial<ParentalControlSettings> = {
      ...validatedSettings,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (hashedCode) {
      // Only update code if provided
      const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
      await userProfileRef.update({
        parentalCode: hashedCode,
      });
    }

    if (existingSettings.exists) {
      await settingsRef.update(settingsData);
    } else {
      await settingsRef.set({
        ...settingsData,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Update user profile settings
    const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
    await userProfileRef.update({
      'settings.restrictSpending': validatedSettings.restrictSpending,
      'settings.restrictChat': validatedSettings.restrictChat,
      'settings.restrictTalentHub': validatedSettings.restrictTalentHub,
      'settings.restrictAITasks': validatedSettings.restrictAITasks,
      'settings.restrictContests': validatedSettings.restrictContests,
      'settings.restrictMarketplace': validatedSettings.restrictMarketplace,
      'settings.enableActivityLogs': validatedSettings.enableActivityLogs,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving parental control settings:', error);
    return { success: false, error: error.message || 'Failed to save settings.' };
  }
}

export async function getParentalControlSettings(idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const settingsRef = db.doc(`users/${uid}/parental-controls/settings`);
    const settingsDoc = await settingsRef.get();

    if (settingsDoc.exists) {
      return { success: true, settings: settingsDoc.data() as ParentalControlSettings };
    }

    // Return default settings
    const defaultSettings: ParentalControlSettings = {
      restrictSpending: false,
      restrictChat: false,
      restrictTalentHub: false,
      restrictAITasks: false,
      restrictContests: false,
      restrictMarketplace: false,
      enableActivityLogs: true,
      notificationInterval: 120, // 2 hours default
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    return { success: true, settings: defaultSettings };
  } catch (error: any) {
    console.error('Error fetching parental control settings:', error);
    return { success: false, error: error.message || 'Failed to fetch settings.' };
  }
}

export async function verifyParentalCode(idToken: string, code: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
    const userProfile = await userProfileRef.get();

    if (!userProfile.exists) {
      return { success: false, error: 'User profile not found.' };
    }

    const hashedCode = userProfile.data()?.parentalCode;
    if (!hashedCode) {
      return { success: false, error: 'No parental code set.' };
    }

    const isValid = await bcrypt.compare(code, hashedCode);
    return { success: isValid, error: isValid ? undefined : 'Invalid code.' };
  } catch (error: any) {
    console.error('Error verifying parental code:', error);
    return { success: false, error: error.message || 'Failed to verify code.' };
  }
}

