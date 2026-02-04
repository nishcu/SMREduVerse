'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/moderate-real-time-chat.ts';
import '@/ai/flows/generate-creative-tasks.ts';
import '@/ai/flows/generate-recommended-posts.ts';
import '@/ai/flows/generate-trending-posts.ts';
import '@/ai/flows/generate-recommended-courses.ts';
