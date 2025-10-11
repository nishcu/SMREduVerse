'use server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Post } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function getPostsAction(): Promise<Post[]> {
    const { db } = getFirebaseAdmin();
    if (!db) return [];

    try {
        const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate().toISOString(), // Convert to serializable format
        } as unknown as Post));
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

export async function deletePostAction(id: string) {
    const { db } = getFirebaseAdmin();
    if (!db) {
        return { success: false, error: 'Database not initialized' };
    }

    try {
        await db.collection('posts').doc(id).delete();
        revalidatePath('/super-admin/content');
        revalidatePath('/social');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
