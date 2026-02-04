import { db } from '@/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Chat, User } from '@/lib/types';
import { serverTimestamp } from 'firebase/firestore';

export async function startPrivateChat(currentUser: User, otherUser: User): Promise<string> {
  try {
    // Check if a private chat already exists
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.id),
      where('type', '==', 'private')
    );
    const chatSnapshot = await getDocs(chatsQuery);
    const existingChat = chatSnapshot.docs.find((doc) => {
      const chat = doc.data() as Chat;
      return chat.participants.includes(otherUser.id);
    });

    if (existingChat) {
      return existingChat.id;
    }

    // Create a new chat
    const chatId = `chat_${currentUser.id}_${otherUser.id}_${Date.now()}`;
    const chatData: Chat = {
      id: chatId,
      type: 'private',
      participants: [currentUser.id, otherUser.id],
      participantDetails: {
        [currentUser.id]: { name: currentUser.name, avatarUrl: currentUser.avatarUrl },
        [otherUser.id]: { name: otherUser.name, avatarUrl: otherUser.avatarUrl },
      },
      lastMessage: null,
      createdAt: serverTimestamp() as any,
    };

    await setDoc(doc(db, 'chats', chatId), chatData);
    return chatId;
  } catch (error) {
    console.error('Error starting chat:', error);
    throw new Error('Failed to start chat');
  }
}