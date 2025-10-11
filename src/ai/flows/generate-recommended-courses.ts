'use server';
/**
 * @fileOverview Generates a personalized list of recommended courses for a user.
 *
 * - generateRecommendedCourses - A function that returns a ranked list of course IDs.
 * - GenerateRecommendedCoursesInput - The input type for the function.
 * - GenerateRecommendedCoursesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserContextSchema = z.object({
  id: z.string(),
  bio: z.string().optional(),
  interests: z.array(z.string()).optional(),
  grade: z.string().optional(),
  // Could also include courses they've completed in the future
});

const CourseContextSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    subject: z.string(),
});

export const GenerateRecommendedCoursesInputSchema = z.object({
  user: UserContextSchema.describe("The user for whom to generate recommendations."),
  courses: z.array(CourseContextSchema).describe("A list of all available courses to choose from."),
});
export type GenerateRecommendedCoursesInput = z.infer<typeof GenerateRecommendedCoursesInputSchema>;

export const GenerateRecommendedCoursesOutputSchema = z.object({
    recommendedCourseIds: z.array(z.string()).describe("An array of course IDs, ranked from most to least relevant for the user."),
});
export type GenerateRecommendedCoursesOutput = z.infer<typeof GenerateRecommendedCoursesOutputSchema>;


export async function generateRecommendedCourses(
  input: GenerateRecommendedCoursesInput
): Promise<GenerateRecommendedCoursesOutput> {
  return generateRecommendedCoursesFlow(input);
}

const generateRecommendedCoursesPrompt = ai.definePrompt({
  name: 'generateRecommendedCoursesPrompt',
  input: {schema: GenerateRecommendedCoursesInputSchema},
  output: {schema: GenerateRecommendedCoursesOutputSchema},
  prompt: `You are an academic advisor AI for a social learning platform. Your goal is to recommend relevant courses to a user to help them on their learning journey.

  Analyze the user's profile and the list of available courses. Based on the user's interests, bio, and grade level, return a ranked list of course IDs that would be most beneficial and engaging for them.

  User Profile:
  - Bio: {{{user.bio}}}
  - Interests: {{#if user.interests}}{{#each user.interests}}{{{this}}}{{/each}}{{else}}Not specified{{/if}}
  - Grade: {{{user.grade}}}

  Available Courses (format: [id] - [subject] - [title] - [description]):
  {{#each courses}}
  - [{{{this.id}}}] - [{{{this.subject}}}] - [{{{this.title}}}] - {{{this.description}}}
  {{/each}}

  Return a JSON object containing a single key, "recommendedCourseIds", with an array of course IDs sorted by relevance (most relevant first).
  `,
});

const generateRecommendedCoursesFlow = ai.defineFlow(
  {
    name: 'generateRecommendedCoursesFlow',
    inputSchema: GenerateRecommendedCoursesInputSchema,
    outputSchema: GenerateRecommendedCoursesOutputSchema,
  },
  async input => {
    const {output} = await generateRecommendedCoursesPrompt(input);
    return output!;
  }
);
