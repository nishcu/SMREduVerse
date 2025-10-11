
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { User } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function getUsersAction(): Promise<User[]> {
    const { db } = await getFirebaseAdmin();
    if (!db) return [];

    try {
        const usersSnapshot = await db.collectionGroup('profile').get();
        return usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as User;
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function updateUserAdminStatusAction(uid: string, isSuperAdmin: boolean) {
    const { db } = await getFirebaseAdmin();
    if (!db) return { success: false, error: 'Database not initialized' };

    try {
        const userRef = db.doc(`users/${uid}/profile/${uid}`);
        await userRef.update({ isSuperAdmin });
        revalidatePath('/super-admin/users');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
