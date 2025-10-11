'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskGenerator } from './task-generator';
import { DailySession } from './daily-session';

export default function BrainLabPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl">
          The Brain Lab
        </h1>
        <p className="text-muted-foreground">
          AI-powered learning assistance and daily gamified mental exercises.
        </p>
      </div>

      <Tabs defaultValue="task-generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="task-generator">Task Generator</TabsTrigger>
          <TabsTrigger value="daily-session">Daily Session</TabsTrigger>
        </TabsList>
        <TabsContent value="task-generator">
          <TaskGenerator />
        </TabsContent>
        <TabsContent value="daily-session">
          <DailySession />
        </TabsContent>
      </Tabs>
    </div>
  );
}
