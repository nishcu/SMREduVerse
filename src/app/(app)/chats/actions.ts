
'use server';

import { getAdminDb } from '@/lib/firebase-admin-new';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

function createChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
}

export async function getOrCreateChatAction(uid1: string, uid2: string) {
    const db = getAdminDb();

    if (!uid1 || !uid2) {
        return { success: false, error: 'Both user IDs must be provided.' };
    }

    const chatId = createChatId(uid1, uid2);
    const chatRef = db.collection('chats').doc(chatId);

    try {
        const chatDoc = await chatRef.get();

        if (chatDoc.exists) {
            return { success: true, chatId: chatDoc.id, isNew: false };
        }

        // Fetch user profiles to store names and avatars
        const user1ProfileSnap = await db.collection('users').doc(uid1).collection('profile').limit(1).get();
        const user2ProfileSnap = await db.collection('users').doc(uid2).collection('profile').limit(1).get();
        
        if (user1ProfileSnap.empty || user2ProfileSnap.empty) {
            return { success: false, error: 'One or both user profiles not found.' };
        }

        const user1Data = user1ProfileSnap.docs[0].data();
        const user2Data = user2ProfileSnap.docs[0].data();

        const newChatData = {
            participants: [uid1, uid2],
            participantDetails: {
                [uid1]: {
                    uid: uid1,
                    name: user1Data.name,
                    avatarUrl: user1Data.avatarUrl,
                },
                [uid2]: {
                    uid: uid2,
                    name: user2Data.name,
                    avatarUrl: user2Data.avatarUrl,
                }
            },
            type: 'private',
            lastMessage: null,
            createdAt: FieldValue.serverTimestamp(),
        };

        await chatRef.set(newChatData);

        revalidatePath('/chats');

        return { success: true, chatId: chatRef.id, isNew: true };

    } catch (error: any) {
        console.error('Error in getOrCreateChatAction:', error);
        return { success: false, error: error.message || 'An unknown error occurred.' };
    }
}
