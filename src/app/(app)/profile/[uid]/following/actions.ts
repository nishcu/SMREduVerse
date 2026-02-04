'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

export async function getFollowingAction(uid: string, idToken?: string) {
  const db = getAdminDb();
  
  try {
    // Get all users being followed
    const followingSnapshot = await db
      .collection(`users/${uid}/following`)
      .orderBy('createdAt', 'desc')
      .get();

    const followingIds = followingSnapshot.docs.map(doc => doc.id);
    
    if (followingIds.length === 0) {
      return { success: true, following: [] };
    }

    // Get following profiles
    const followingProfiles = await Promise.all(
      followingIds.map(async (followingId) => {
        const profileRef = db.doc(`users/${followingId}/profile/${followingId}`);
        const profileSnap = await profileRef.get();
        if (profileSnap.exists) {
          return {
            id: profileSnap.id,
            ...profileSnap.data(),
            createdAt: profileSnap.data()?.createdAt?.toDate ? profileSnap.data().createdAt.toDate().toISOString() : profileSnap.data().createdAt,
          } as User;
        }
        return null;
      })
    );

    const following = followingProfiles.filter((profile): profile is User => profile !== null);

    // Check if current user is following each user (if authenticated)
    let followingStatus: Record<string, boolean> = {};
    if (idToken) {
      try {
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        const currentUserId = decodedToken.uid;

        const followingChecks = await Promise.all(
          following.map(async (user) => {
            const followRef = db.doc(`users/${currentUserId}/following/${user.id}`);
            const followSnap = await followRef.get();
            return { userId: user.id, following: followSnap.exists };
          })
        );

        followingStatus = followingChecks.reduce((acc, check) => {
          acc[check.userId] = check.following;
          return acc;
        }, {} as Record<string, boolean>);
      } catch (error) {
        // If token is invalid, just skip following status
      }
    }

    return { success: true, following, followingStatus };
  } catch (error: any) {
    console.error('Error fetching following:', error);
    return { success: false, error: error.message || 'Failed to fetch following.', following: [] };
  }
}

