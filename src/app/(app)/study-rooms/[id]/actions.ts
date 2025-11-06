'use server';

import { moderateRealTimeChat } from '@/ai/flows/moderate-real-time-chat';

// Common safe greetings and words that should never be flagged
const SAFE_WORDS = [
  'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'good night',
  'thanks', 'thank you', 'please', 'yes', 'no', 'ok', 'okay', 'sure', 'yep', 'nope',
  'how are you', 'how are you doing', 'what\'s up', 'whats up', 'sup',
  'nice to meet you', 'goodbye', 'bye', 'see you', 'later', 'see ya',
  'great', 'good', 'nice', 'cool', 'awesome', 'amazing', 'wow', 'wonderful',
  'help', 'question', 'answer', 'explain', 'understand', 'learn', 'study',
  'haha', 'lol', 'lmao', 'hahaha', 'hehe', 'hehehe',
  'sorry', 'excuse me', 'pardon', 'my bad', 'oops',
  'congratulations', 'congrats', 'well done', 'good job', 'bravo',
  'welcome', 'you\'re welcome', 'no problem', 'no worries', 'anytime'
];

// Simple check for obviously safe messages
function isSafeMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Empty or very short messages are safe
  if (lowerMessage.length <= 3) {
    return true;
  }
  
  // Check if message is just a safe word or starts with a safe greeting
  if (SAFE_WORDS.some(word => lowerMessage === word || lowerMessage.startsWith(word + ' '))) {
    return true;
  }
  
  // Very short messages (1-3 words) that contain safe words are likely safe
  const words = lowerMessage.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 3 && SAFE_WORDS.some(word => words.includes(word))) {
    return true;
  }
  
  // Messages that are mostly safe words are safe
  const safeWordCount = words.filter(w => SAFE_WORDS.some(sw => w.includes(sw) || sw.includes(w))).length;
  if (words.length <= 5 && safeWordCount >= words.length * 0.5) {
    return true;
  }
  
  return false;
}

export async function moderateMessage(message: string) {
  // Skip moderation for obviously safe messages
  if (isSafeMessage(message)) {
    return { flagForReview: false, reason: '' };
  }

  // For now, be very lenient - only flag obvious violations
  // Most messages should pass through
  try {
    // Add timeout to prevent hanging (reduced to 3 seconds for faster response)
    const timeoutPromise = new Promise<{ flagForReview: boolean; reason: string }>((resolve) => {
      setTimeout(() => {
        resolve({ flagForReview: false, reason: 'Moderation timeout - allowing message' });
      }, 3000); // 3 second timeout
    });

    const moderationPromise = moderateRealTimeChat({ message }).then(result => ({
      // Only flag if AI is very confident it's inappropriate
      flagForReview: result.flagForReview === true && result.reason && result.reason.length > 20,
      reason: result.reason || ''
    }));

    const result = await Promise.race([moderationPromise, timeoutPromise]);
    
    // Additional safety check: if message is short and doesn't contain obvious profanity, allow it
    const lowerMessage = message.toLowerCase().trim();
    const obviousProfanity = ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'cunt'];
    const hasObviousProfanity = obviousProfanity.some(word => lowerMessage.includes(word));
    
    if (!hasObviousProfanity && lowerMessage.length < 100) {
      return { flagForReview: false, reason: '' };
    }
    
    return result;
  } catch (error) {
    // Fail open: if moderation service fails, allow the message through
    // This prevents blocking legitimate messages when the service is unavailable
    return { flagForReview: false, reason: 'Moderation service unavailable - message allowed' };
  }
}
