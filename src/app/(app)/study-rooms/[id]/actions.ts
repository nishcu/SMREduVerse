'use server';

import { moderateRealTimeChat } from '@/ai/flows/moderate-real-time-chat';

export async function moderateMessage(message: string) {
  try {
    const result = await moderateRealTimeChat({ message });
    return result;
  } catch (error) {
    console.error('Error moderating message:', error);
    // In case of an error, we can decide to be lenient or strict.
    // Let's be strict and flag it for review.
    return { flagForReview: true, reason: 'Moderation service unavailable.' };
  }
}
