'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

export async function getFollowersAction(uid: string, idToken?: string) {
  const db = getAdminDb();
  
  try {
    // Get all followers
    const followersSnapshot = await db
      .collection(`users/${uid}/followers`)
      .orderBy('createdAt', 'desc')
      .get();

    const followerIds = followersSnapshot.docs.map(doc => doc.id);
    
    if (followerIds.length === 0) {
      return { success: true, followers: [] };
    }

    // Get follower profiles
    const followerProfiles = await Promise.all(
      followerIds.map(async (followerId) => {
        const profileRef = db.doc(`users/${followerId}/profile/${followerId}`);
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

    const followers = followerProfiles.filter((profile): profile is User => profile !== null);

    // Check if current user is following each follower (if authenticated)
    let followingStatus: Record<string, boolean> = {};
    if (idToken) {
      try {
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        const currentUserId = decodedToken.uid;

        const followingChecks = await Promise.all(
          followers.map(async (follower) => {
            const followRef = db.doc(`users/${currentUserId}/following/${follower.id}`);
            const followSnap = await followRef.get();
            return { userId: follower.id, following: followSnap.exists };
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

    return { success: true, followers, followingStatus };
  } catch (error: any) {
    console.error('Error fetching followers:', error);
    return { success: false, error: error.message || 'Failed to fetch followers.', followers: [] };
  }
}

