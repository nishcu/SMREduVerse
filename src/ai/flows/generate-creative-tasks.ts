'use server';
/**
 * @fileOverview Generates educational tasks based on a selected category and difficulty level.
 *
 * - generateCreativeTasks - A function that generates educational tasks.
 * - GenerateCreativeTasksInput - The input type for the generateCreativeTasks function.
 * - GenerateCreativeTasksOutput - The return type for the generateCreativeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateCreativeTasksInputSchema = z.object({
  topic: z.string().describe('The subject matter for the task (e.g., "The Solar System," "Shakespearean Sonnets").'),
  taskType: z.enum(['Writing Prompt', 'Art Project', 'Science Experiment']).describe('The kind of activity to generate.'),
  gradeLevel: z.enum(['Middle School', 'High School', 'University']).describe("The task's difficulty and complexity level."),
  assets: z.string().optional().describe('A list of available materials or assets (e.g., "crayons, paper, internet access").'),
});
export type GenerateCreativeTasksInput = z.infer<typeof GenerateCreativeTasksInputSchema>;

export const GenerateCreativeTasksOutputSchema = z.object({
    taskTitle: z.string().describe("A short, engaging title for the task."),
    taskDescription: z.string().describe("A one-sentence summary of the goal of the task."),
    instructions: z.array(z.string()).describe("A list of clear, step-by-step instructions to complete the task."),
    materialsNeeded: z.array(z.string()).optional().describe("A list of materials needed, if any. The list should be derived from the user's provided assets."),
    knowledgeCoinsAward: z.number().describe("The number of Knowledge Coins the student will earn for completing the task. This should be between 10 and 50, based on complexity."),
});
export type GenerateCreativeTasksOutput = z.infer<typeof GenerateCreativeTasksOutputSchema>;


export async function generateCreativeTasks(
  input: GenerateCreativeTasksInput
): Promise<GenerateCreativeTasksOutput> {
  return generateCreativeTasksFlow(input);
}

const generateCreativeTasksPrompt = ai.definePrompt({
  name: 'generateCreativeTasksPrompt',
  input: {schema: GenerateCreativeTasksInputSchema},
  output: {schema: GenerateCreativeTasksOutputSchema},
  prompt: `You are an experienced educator creating a custom learning task for a student. Your goal is to design an engaging and educational activity based on the user's specifications.

  Student's Request:
  - Topic: {{{topic}}}
  - Task Type: {{{taskType}}}
  - Grade Level: {{{gradeLevel}}}
  {{#if assets}}- Available Materials: {{{assets}}}{{/if}}

  Based on this, generate a structured task. Provide a clear title, a short description, and step-by-step instructions. If the user listed materials, suggest which of those to use. Finally, assign a reward in Knowledge Coins (from 10 to 50) based on the task's complexity.
  `,
});

const generateCreativeTasksFlow = ai.defineFlow(
  {
    name: 'generateCreativeTasksFlow',
    inputSchema: GenerateCreativeTasksInputSchema,
    outputSchema: GenerateCreativeTasksOutputSchema,
  },
  async input => {
    const {output} = await generateCreativeTasksPrompt(input);
    return output!;
  }
);
