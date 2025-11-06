'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
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
        const user1ProfileSnap = await db.doc(`users/${uid1}/profile/${uid1}`).get();
        const user2ProfileSnap = await db.doc(`users/${uid2}/profile/${uid2}`).get();
        
        if (!user1ProfileSnap.exists || !user2ProfileSnap.exists) {
            return { success: false, error: 'One or both user profiles not found.' };
        }

        const user1Data = user1ProfileSnap.data();
        const user2Data = user2ProfileSnap.data();

        const newChatData = {
            participants: [uid1, uid2],
            participantDetails: {
                [uid1]: {
                    uid: uid1,
                    name: user1Data?.name || 'Unknown',
                    avatarUrl: user1Data?.avatarUrl || '',
                },
                [uid2]: {
                    uid: uid2,
                    name: user2Data?.name || 'Unknown',
                    avatarUrl: user2Data?.avatarUrl || '',
                }
            },
            type: 'private',
            lastMessage: null,
            createdAt: FieldValue.serverTimestamp(),
            unreadCount: {
                [uid1]: 0,
                [uid2]: 0,
            },
        };

        await chatRef.set(newChatData);

        revalidatePath('/chats');

        return { success: true, chatId: chatRef.id, isNew: true };

    } catch (error: any) {
        console.error('Error in getOrCreateChatAction:', error);
        return { success: false, error: error.message || 'An unknown error occurred.' };
    }
}

export async function markMessagesAsReadAction(chatId: string, userId: string) {
    const db = getAdminDb();

    try {
        const chatRef = db.collection('chats').doc(chatId);
        const chatSnap = await chatRef.get();

        if (!chatSnap.exists) {
            return { success: false, error: 'Chat not found.' };
        }

        // Reset unread count for this user
        await chatRef.update({
            [`unreadCount.${userId}`]: 0,
        });

        // Mark all unread messages as read
        // Get all messages that are not read by this user
        const messagesSnapshot = await db
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .get();

        const batch = db.batch();
        let hasUpdates = false;

        messagesSnapshot.docs.forEach((docSnap) => {
            const message = docSnap.data();
            // Only mark messages from other users as read
            if (message.authorUid !== userId && (!message.readBy || !message.readBy.includes(userId))) {
                batch.update(docSnap.ref, {
                    readBy: FieldValue.arrayUnion(userId),
                });
                hasUpdates = true;
            }
        });

        if (hasUpdates) {
            await batch.commit();
        }

        revalidatePath(`/chats/${chatId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error marking messages as read:', error);
        return { success: false, error: error.message || 'Failed to mark messages as read.' };
    }
}

export async function sendTypingIndicatorAction(chatId: string, userId: string, isTyping: boolean) {
    const db = getAdminDb();

    try {
        const typingRef = db.collection('chats').doc(chatId).collection('typing').doc(userId);
        
        if (isTyping) {
            await typingRef.set({
                userId,
                isTyping: true,
                timestamp: FieldValue.serverTimestamp(),
            });
        } else {
            await typingRef.delete();
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending typing indicator:', error);
        return { success: false, error: error.message || 'Failed to send typing indicator.' };
    }
}

export async function createChatNotificationAction(chatId: string, senderId: string, messageContent: string, recipientId: string) {
    const db = getAdminDb();

    try {
        // Get sender profile
        const senderProfileRef = db.doc(`users/${senderId}/profile/${senderId}`);
        const senderProfileSnap = await senderProfileRef.get();
        
        if (!senderProfileSnap.exists) {
            return { success: false };
        }

        const senderProfile = senderProfileSnap.data()!;

        // Create notification
        const notificationRef = db.collection(`users/${recipientId}/notifications`).doc();
        await notificationRef.set({
            type: 'chat_message',
            actor: {
                uid: senderId,
                name: senderProfile.name || 'Someone',
                avatarUrl: senderProfile.avatarUrl || '',
            },
            data: {
                chatId,
                messagePreview: messageContent.slice(0, 100),
            },
            read: false,
            createdAt: FieldValue.serverTimestamp(),
        });

        // Increment unread count for recipient
        const chatRef = db.collection('chats').doc(chatId);
        await chatRef.update({
            [`unreadCount.${recipientId}`]: FieldValue.increment(1),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error creating chat notification:', error);
        return { success: false, error: error.message };
    }
}
