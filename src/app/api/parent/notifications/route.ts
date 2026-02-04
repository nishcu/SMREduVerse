import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import type { ParentNotification } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedToken = await auth.verifyIdToken(idToken);
    const parentId = decodedToken.uid;

    // Fetch notifications for this parent
    const notificationsSnapshot = await db
      .collection(`users/${parentId}/parent-notifications`)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ParentNotification));

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error('Error fetching parent notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

