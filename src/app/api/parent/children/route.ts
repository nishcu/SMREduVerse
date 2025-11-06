import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

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

    // Get parent profile to find children
    const parentProfileRef = db.doc(`users/${parentId}/profile/${parentId}`);
    const parentProfile = await parentProfileRef.get();

    if (!parentProfile.exists) {
      return NextResponse.json({
        success: true,
        children: [],
      });
    }

    const childrenIds = parentProfile.data()?.children || [];

    // Fetch children profiles
    const children = await Promise.all(
      childrenIds.map(async (childId: string) => {
        const childProfileRef = db.doc(`users/${childId}/profile/${childId}`);
        const childProfile = await childProfileRef.get();
        if (childProfile.exists) {
          return {
            id: childId,
            ...childProfile.data(),
          };
        }
        return null;
      })
    );

    const validChildren = children.filter(child => child !== null);

    return NextResponse.json({
      success: true,
      children: validChildren,
    });
  } catch (error: any) {
    console.error('Error fetching children:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch children' },
      { status: 500 }
    );
  }
}

