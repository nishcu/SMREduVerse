'use client';

import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Loader2 } from 'lucide-react';
import { useEffect, useState, useActionState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { GenerateCreativeTasksOutput } from '@/ai/flows/generate-creative-tasks';
import { generateTaskAction } from './actions';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const initialState: {
  task?: GenerateCreativeTasksOutput;
  error?: string;
  errors?: any;
} = {};

export function TaskGenerator() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(generateTaskAction, initialState);
  
  const form = useForm({
     defaultValues: {
      topic: '',
      taskType: 'Writing Prompt',
      gradeLevel: 'Middle School',
      assets: '',
    },
  });

  useEffect(() => {
    if (state?.error) {
      toast({ variant: 'destructive', title: 'Error Generating Task', description: state.error });
    }
    if(state?.task){
        toast({ title: 'Task Generated!', description: 'Your new task is ready.' });
    }
  }, [state, toast]);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <Card>
        <Form {...form}>
          <form action={formAction}>
            <CardHeader>
              <CardTitle>Task Generator</CardTitle>
              <CardDescription>
                Use Knowledge Coins to generate a custom educational task with AI.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <Label>Topic</Label>
                    <FormControl>
                      <Input placeholder="e.g., 'The Solar System'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Task Type</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Writing Prompt">Writing Prompt</SelectItem>
                          <SelectItem value="Art Project">Art Project</SelectItem>
                          <SelectItem value="Science Experiment">Science Experiment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Grade Level</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Middle School">Middle School</SelectItem>
                          <SelectItem value="High School">High School</SelectItem>
                          <SelectItem value="University">University</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="assets"
                render={({ field }) => (
                  <FormItem>
                    <Label>Educational Assets (Optional)</Label>
                    <FormControl>
                      <Textarea placeholder="e.g., 'crayons, paper, internet access'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <input type="hidden" name="idToken" value={firebaseUser?.uid || ''} />
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={isPending || !firebaseUser} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" /> Generate Task
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Generated Task</CardTitle>
          <CardDescription>Your AI-generated task will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          {isPending ? (
            <div className="text-center text-muted-foreground">
              <Loader2 className="mx-auto h-12 w-12 animate-spin" />
            </div>
          ) : state?.task ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-primary">{state.task.taskTitle}</h3>
              <p className="text-sm">{state.task.taskDescription}</p>
              <div>
                <h4 className="font-semibold mb-2">Instructions:</h4>
                <ul className="list-decimal list-inside space-y-1 text-sm">
                  {state.task.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
              {state.task.materialsNeeded?.length ? (
                <div>
                  <h4 className="font-semibold mb-2">Materials Needed:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {state.task.materialsNeeded.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <h4 className="font-semibold mb-2">Reward:</h4>
                <p className="text-sm">{state.task.knowledgeCoinsAward} Knowledge Coins</p>
              </div>
            </div>
          ) : state?.error ? (
            <p className="text-destructive text-center">{state.error}</p>
          ) : (
            <div className="text-center text-muted-foreground">
              <Bot className="mx-auto h-12 w-12" />
              <p>Awaiting task generation...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
