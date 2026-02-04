'use server';

// Extremely lenient moderation - only block obvious profanity
// Privacy is protected - users can communicate freely
export async function moderateMessage(message: string) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Only flag messages with obvious profanity or hate speech
  // This is a very minimal list - most messages will pass through
  const blockedWords = [
    // Obvious profanity (very limited list)
    'fuck', 'fucking', 'fucked',
    'shit', 'shitting',
    'bitch', 'bitches',
    'asshole', 'assholes',
    'bastard', 'bastards',
    'cunt', 'cunts',
    // Hate speech indicators (very specific)
    'kill yourself', 'kys', 'die',
  ];
  
  // Check if message contains blocked words
  const hasBlockedWord = blockedWords.some(word => {
    // Match whole words only, not substrings
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerMessage);
  });
  
  // Only flag if it contains obvious profanity
  // Everything else is allowed to protect user privacy
  if (hasBlockedWord) {
    return { flagForReview: true, reason: 'Message contains inappropriate language' };
  }
  
  // Allow all other messages - privacy is protected
  return { flagForReview: false, reason: '' };
}
