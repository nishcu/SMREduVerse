'use server';

/**
 * @fileOverview A real-time chat moderation AI agent.
 *
 * - moderateRealTimeChat - A function that handles the chat moderation process.
 * - ModerateRealTimeChatInput - The input type for the moderateRealTimeChat function.
 * - ModerateRealTimeChatOutput - The return type for the moderateRealTimeChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateRealTimeChatInputSchema = z.object({
  message: z.string().describe('The message to be checked for inappropriate content.'),
});
export type ModerateRealTimeChatInput = z.infer<typeof ModerateRealTimeChatInputSchema>;

const ModerateRealTimeChatOutputSchema = z.object({
  flagForReview: z.boolean().describe('Whether the message should be flagged for review.'),
  reason: z.string().describe('The reason for flagging the message, if any.'),
});
export type ModerateRealTimeChatOutput = z.infer<typeof ModerateRealTimeChatOutputSchema>;

export async function moderateRealTimeChat(input: ModerateRealTimeChatInput): Promise<ModerateRealTimeChatOutput> {
  return moderateRealTimeChatFlow(input);
}

const moderateRealTimeChatPrompt = ai.definePrompt({
  name: 'moderateRealTimeChatPrompt',
  input: {schema: ModerateRealTimeChatInputSchema},
  output: {schema: ModerateRealTimeChatOutputSchema},
  prompt: `You are a moderator for a real-time chat application used by students. Your task is to review incoming messages and determine if they contain inappropriate content.

  IMPORTANT GUIDELINES:
  - ONLY flag messages that clearly contain:
    * Hate speech, slurs, or discriminatory language
    * Harassment, bullying, or threats
    * Sexually explicit or pornographic content
    * Content promoting illegal activities (drugs, violence, etc.)
    * Spam or malicious links
  
  - DO NOT flag:
    * Common greetings (hello, hi, hey, good morning, etc.)
    * Polite conversation (please, thank you, etc.)
    * Educational discussions
    * Normal social interactions
    * Questions or requests for help
    * Casual conversation between students
  
  - Be VERY lenient - only flag content that is clearly and obviously inappropriate.
  - When in doubt, do NOT flag the message.
  - Remember: This is an educational platform for students - allow normal, friendly communication.

  Message to review: {{{message}}}

  Return a JSON object with:
  - flagForReview: true ONLY if the message clearly violates the guidelines above, false otherwise
  - reason: A brief explanation if flagged, empty string if not flagged
  `,
});

const moderateRealTimeChatFlow = ai.defineFlow(
  {
    name: 'moderateRealTimeChatFlow',
    inputSchema: ModerateRealTimeChatInputSchema,
    outputSchema: ModerateRealTimeChatOutputSchema,
  },
  async input => {
    const {output} = await moderateRealTimeChatPrompt(input);
    return output!;
  }
);
