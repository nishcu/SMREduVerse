'use server';

import { getAdminDb } from '@/lib/firebase-admin';
import type { Timestamp } from 'firebase-admin/firestore';
import type { Course } from '@/lib/types';

function toISO(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  const t = value as { toDate?: () => Date; toMillis?: () => number };
  if (t.toDate) return t.toDate().toISOString();
  if (typeof t.toMillis === 'function') return new Date(t.toMillis()).toISOString();
  return undefined;
}

export async function getAllCoursesAction(): Promise<Course[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('courses').get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: toISO(data.startDate),
        createdAt: toISO((data as { createdAt?: Timestamp }).createdAt),
      } as Course;
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

