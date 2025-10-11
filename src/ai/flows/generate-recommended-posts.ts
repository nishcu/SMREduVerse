'use server';
/**
 * @fileOverview Generates a personalized list of recommended posts for a user.
 *
 * - generateRecommendedPosts - A function that returns a ranked list of post IDs.
 * - GenerateRecommendedPostsInput - The input type for the function.
 * - GenerateRecommendedPostsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Post, User } from '@/lib/types';

// We only need a subset of user and post properties for the recommendation
const UserContextSchema = z.object({
  id: z.string(),
  bio: z.string().optional(),
  interests: z.array(z.string()).optional(),
  grade: z.string().optional(),
  subject: z.string().optional(),
});

const PostContextSchema = z.object({
    id: z.string(),
    content: z.string(),
    subject: z.string(),
});

export const GenerateRecommendedPostsInputSchema = z.object({
  user: UserContextSchema.describe("The user for whom to generate recommendations."),
  posts: z.array(PostContextSchema).describe("A list of all available posts to choose from."),
});
export type GenerateRecommendedPostsInput = z.infer<typeof GenerateRecommendedPostsInputSchema>;

export const GenerateRecommendedPostsOutputSchema = z.object({
    recommendedPostIds: z.array(z.string()).describe("An array of post IDs, ranked from most to least relevant for the user."),
});
export type GenerateRecommendedPostsOutput = z.infer<typeof GenerateRecommendedPostsOutputSchema>;


export async function generateRecommendedPosts(
  input: GenerateRecommendedPostsInput
): Promise<GenerateRecommendedPostsOutput> {
  return generateRecommendedPostsFlow(input);
}

const generateRecommendedPostsPrompt = ai.definePrompt({
  name: 'generateRecommendedPostsPrompt',
  input: {schema: GenerateRecommendedPostsInputSchema},
  output: {schema: GenerateRecommendedPostsOutputSchema},
  prompt: `You are a recommendation engine for a social learning platform. Your goal is to create a personalized "For You" feed for a user.

  Analyze the user's profile and the list of available posts. Based on the user's interests, bio, grade, and preferred subjects, return a ranked list of post IDs that would be most engaging for them.

  User Profile:
  - Bio: {{{user.bio}}}
  - Interests: {{#if user.interests}}{{#each user.interests}}{{{this}}}{{/each}}{{else}}Not specified{{/if}}
  - Grade: {{{user.grade}}}

  Available Posts (format: [id] - [subject] - [content]):
  {{#each posts}}
  - [{{{this.id}}}] - [{{{this.subject}}}] - {{{this.content}}}
  {{/each}}

  Return a JSON object containing a single key, "recommendedPostIds", with an array of post IDs sorted by relevance (most relevant first).
  `,
});

const generateRecommendedPostsFlow = ai.defineFlow(
  {
    name: 'generateRecommendedPostsFlow',
    inputSchema: GenerateRecommendedPostsInputSchema,
    outputSchema: GenerateRecommendedPostsOutputSchema,
  },
  async input => {
    // To optimize for performance and cost, we could limit the number of posts sent to the LLM.
    // For now, we'll send all of them as specified in the plan.
    const {output} = await generateRecommendedPostsPrompt(input);
    return output!;
  }
);
