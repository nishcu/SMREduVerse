'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import type { Course } from '@/lib/types';

export async function getAllCoursesAction(): Promise<Course[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('courses').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Course));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

