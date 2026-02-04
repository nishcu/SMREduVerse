import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import type { User } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idToken = searchParams.get('idToken');

  if (!idToken) {
    return NextResponse.json({ error: 'Authentication token is required.' }, { status: 401 });
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    // Get all user profiles (excluding current user)
    const profilesSnapshot = await db.collectionGroup('profile').limit(100).get();

    const allUsers: User[] = [];
    const followingStatus: Record<string, boolean> = {};

    // Get current user's following list
    const followingSnapshot = await db.collection(`users/${currentUserId}/following`).get();
    const followingIds = followingSnapshot.docs.map(doc => doc.id);

    // Process all profiles
    for (const doc of profilesSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      // Skip current user
      if (userId === currentUserId) continue;

      // Check if following
      followingStatus[userId] = followingIds.includes(userId);

      allUsers.push({
        id: userId,
        ...userData,
        createdAt: userData?.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : userData.createdAt,
      } as User);
    }

    // Sort by followers count (most popular first)
    allUsers.sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0));

    return NextResponse.json({ 
      success: true, 
      users: allUsers,
      followingStatus
    });
  } catch (error: any) {
    console.error('Error fetching discover users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch users.' }, { status: 500 });
  }
}

