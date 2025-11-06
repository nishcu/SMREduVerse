'use server';

import { moderateRealTimeChat } from '@/ai/flows/moderate-real-time-chat';

// Common safe greetings and words that should never be flagged
const SAFE_WORDS = [
  'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
  'thanks', 'thank you', 'please', 'yes', 'no', 'ok', 'okay', 'sure',
  'how are you', 'how are you doing', 'what\'s up', 'whats up',
  'nice to meet you', 'goodbye', 'bye', 'see you', 'later'
];

// Simple check for obviously safe messages
function isSafeMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check if message is just a safe word or starts with a safe greeting
  if (SAFE_WORDS.some(word => lowerMessage === word || lowerMessage.startsWith(word + ' '))) {
    return true;
  }
  
  // Very short messages (1-2 words) that are common greetings are likely safe
  const words = lowerMessage.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 2 && SAFE_WORDS.some(word => words.includes(word))) {
    return true;
  }
  
  return false;
}

export async function moderateMessage(message: string) {
  // Skip moderation for obviously safe messages
  if (isSafeMessage(message)) {
    return { flagForReview: false, reason: '' };
  }

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<{ flagForReview: boolean; reason: string }>((resolve) => {
      setTimeout(() => {
        resolve({ flagForReview: false, reason: 'Moderation timeout - allowing message' });
      }, 5000); // 5 second timeout
    });

    const moderationPromise = moderateRealTimeChat({ message }).then(result => ({
      flagForReview: result.flagForReview || false,
      reason: result.reason || ''
    }));

    const result = await Promise.race([moderationPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error('Error moderating message:', error);
    // Fail open: if moderation service fails, allow the message through
    // This prevents blocking legitimate messages when the service is unavailable
    return { flagForReview: false, reason: 'Moderation service unavailable - message allowed' };
  }
}
