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

  Consider the following guidelines:
  - Flag messages containing hate speech, harassment, or sexually explicit content.
  - Flag messages that are dangerous or promote illegal activities.
  - Flag messages that violate civic integrity or spread misinformation.
  - Be mindful of context; some words may be inappropriate in certain situations but not others.

  Message: {{{message}}}

  Based on these guidelines, determine whether the message should be flagged for review. If so, provide a detailed reason. Return a JSON object.
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
