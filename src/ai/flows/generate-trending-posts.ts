'use server';
/**
 * @fileOverview Identifies and ranks trending posts based on engagement metrics.
 *
 * - generateTrendingPosts - A function that returns a ranked list of trending post IDs.
 * - GenerateTrendingPostsInput - The input type for the function.
 * - GenerateTrendingPostsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { formatDistanceToNow } from 'date-fns';

const PostEngagementSchema = z.object({
    id: z.string(),
    likes: z.number(),
    comments: z.number(),
    createdAt: z.string().describe("The ISO 8601 timestamp of when the post was created."),
});

export const GenerateTrendingPostsInputSchema = z.object({
  posts: z.array(PostEngagementSchema).describe("A list of all recent posts to be analyzed for trends."),
});
export type GenerateTrendingPostsInput = z.infer<typeof GenerateTrendingPostsInputSchema>;

export const GenerateTrendingPostsOutputSchema = z.object({
    trendingPostIds: z.array(z.string()).describe("An array of post IDs, ranked from most to least trending."),
});
export type GenerateTrendingPostsOutput = z.infer<typeof GenerateTrendingPostsOutputSchema>;

export async function generateTrendingPosts(
  input: GenerateTrendingPostsInput
): Promise<GenerateTrendingPostsOutput> {
  // To make the AI's job easier, we can pre-calculate the "time ago" string.
  const processedPosts = input.posts.map(post => ({
    ...post,
    timeAgo: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
  }));
  return generateTrendingPostsFlow({ posts: processedPosts });
}

const generateTrendingPostsPrompt = ai.definePrompt({
  name: 'generateTrendingPostsPrompt',
  input: { schema: GenerateTrendingPostsInputSchema },
  output: { schema: GenerateTrendingPostsOutputSchema },
  prompt: `You are a social media platform's trend analysis engine. Your job is to identify trending content.

  Analyze the following list of posts. A post's trendiness is determined by a combination of likes, comments, and recency. More recent posts with high engagement are more likely to be trending.

  - Likes are a strong indicator.
  - Comments are an even stronger indicator of engagement.
  - Recency is very important; a post from 5 minutes ago with 10 likes is more likely to be trending than a post from 2 days ago with 100 likes.

  Posts (format: [id] - Likes: [likes] - Comments: [comments] - Created: [timeAgo]):
  {{#each posts}}
  - [{{{this.id}}}] - Likes: {{{this.likes}}} - Comments: {{{this.comments}}} - Created: {{{this.timeAgo}}}
  {{/each}}

  Based on your analysis, return a JSON object containing a single key, "trendingPostIds", with an array of post IDs sorted from most trending to least trending.
  `,
});

const generateTrendingPostsFlow = ai.defineFlow(
  {
    name: 'generateTrendingPostsFlow',
    inputSchema: GenerateTrendingPostsInputSchema,
    outputSchema: GenerateTrendingPostsOutputSchema,
  },
  async input => {
    const {output} = await generateTrendingPostsPrompt(input);
    return output!;
  }
);
