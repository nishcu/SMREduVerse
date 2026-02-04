'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { ActivityLog } from '@/lib/types';

// This file must only be imported in server actions/components

export async function logActivity(
  userId: string,
  activityType: ActivityLog['activityType'],
  activityTitle: string,
  activityDetails?: string,
  metadata?: ActivityLog['metadata']
) {
  const db = getAdminDb();

  try {
    // Check if activity logging is enabled for this user
    const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);
    const userProfile = await userProfileRef.get();

    if (!userProfile.exists) {
      return { success: false, error: 'User profile not found.' };
    }

    const settings = userProfile.data()?.settings || {};
    const parentId = userProfile.data()?.parentId;
    
    // If logging is disabled and no parent, skip logging
    if (!settings.enableActivityLogs && !parentId) {
      return { success: true, skipped: true };
    }
    
    // Always log if parent exists (for notifications)
    // Or if logging is enabled

    // Create activity log
    const activityLog: Omit<ActivityLog, 'id'> = {
      userId,
      activityType,
      activityTitle,
      activityDetails,
      metadata,
      timestamp: FieldValue.serverTimestamp(),
    };

    const activityRef = db.collection(`users/${userId}/activity-logs`).doc();
    await activityRef.set(activityLog);

    // Check if user has a parent and trigger notification if needed
    if (parentId) {
      await checkAndSendParentNotification(parentId, userId);
    }

    return { success: true, activityId: activityRef.id };
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message || 'Failed to log activity.' };
  }
}

async function checkAndSendParentNotification(parentId: string, childId: string) {
  const db = getAdminDb();

  try {
    // Get parent's notification settings
    const settingsRef = db.doc(`users/${parentId}/parental-controls/settings`);
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      return;
    }

    const settings = settingsDoc.data();
    const notificationInterval = settings?.notificationInterval || 120; // Default 2 hours

    // Get last notification time
    const lastNotification = settings?.lastNotificationSent?.toMillis?.() || 0;
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotification;
    const intervalMs = notificationInterval * 60 * 1000; // Convert minutes to milliseconds

    // Check if enough time has passed
    if (timeSinceLastNotification < intervalMs) {
      return; // Not time yet
    }

    // Get child profile
    const childProfileRef = db.doc(`users/${childId}/profile/${childId}`);
    const childProfile = await childProfileRef.get();
    const childName = childProfile.data()?.name || 'Your child';

    // Get activities since last notification
    const periodStart = lastNotification > 0 ? Timestamp.fromMillis(lastNotification) : Timestamp.fromMillis(now - intervalMs);
    const periodEnd = Timestamp.now();

    const activitiesSnapshot = await db
      .collection(`users/${childId}/activity-logs`)
      .where('timestamp', '>=', periodStart)
      .where('timestamp', '<=', periodEnd)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ActivityLog));

    if (activities.length === 0) {
      return; // No activities to report
    }

    // Create notification
    const notification = {
      parentId,
      childId,
      childName,
      notificationType: 'activity_summary' as const,
      title: `${childName}'s Activity Summary`,
      message: `${childName} has ${activities.length} activit${activities.length === 1 ? 'y' : 'ies'} in the last ${notificationInterval} minutes.`,
      activities,
      periodStart,
      periodEnd,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    const notificationRef = db.collection(`users/${parentId}/parent-notifications`).doc();
    await notificationRef.set(notification);

    // Update last notification time
    await settingsRef.update({
      lastNotificationSent: FieldValue.serverTimestamp(),
    });

    return { success: true, notificationId: notificationRef.id };
  } catch (error: any) {
    console.error('Error sending parent notification:', error);
    return { success: false, error: error.message || 'Failed to send notification.' };
  }
}

