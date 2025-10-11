
'use client';
import { useEffect, useState, useActionState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { createChapterAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookPlus, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ChapterSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description cannot be empty.').max(500, 'Description must be 500 characters or less.'),
  idToken: z.string().min(1, 'Authentication token is required.'),
  courseId: z.string().min(1, 'Course ID is required.'),
});

type ChapterFormValues = z.infer<typeof ChapterSchema>;

const initialState = {
    success: false,
    error: null,
    errors: null,
    chapterId: undefined
};

export default function CreateChapterPage({ params }: { params: { id: string } }) {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(createChapterAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<ChapterFormValues>({
    defaultValues: {
      title: '',
      description: '',
      idToken: '',
      courseId: params.id,
    },
  });

  useEffect(() => {
    const fetchToken = async () => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        form.setValue('idToken', token);
      }
    };
    fetchToken();
  }, [firebaseUser, form]);

  useEffect(() => {
    if (formState?.success && formState.chapterId) {
      toast({
        title: 'Chapter Created!',
        description: 'Your new chapter has been added to the course.',
      });
      router.push(`/courses/${params.id}/edit`);
    }
  }, [formState, router, toast, params]);

  if (authLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create New Chapter</CardTitle>
          <CardDescription>Add a new chapter to your course.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              ref={formRef}
              action={formAction}
              onSubmit={(evt) => {
                evt.preventDefault();
                form.handleSubmit(() => {
                    formRef.current?.submit();
                })(evt);
              }}
              className="space-y-6"
            >
              {formState?.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error Creating Chapter</AlertTitle>
                  <AlertDescription>
                    {formState.error}
                    {formState.errors && (
                      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-destructive/10 p-4 text-xs font-mono">
                        {JSON.stringify(formState.errors, null, 2)}
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Mechanics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What will students learn in this chapter?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <input type="hidden" {...form.register('idToken')} />
              <input type="hidden" {...form.register('courseId')} />

              <Button type="submit" disabled={isPending || !form.watch('idToken')}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookPlus className="mr-2 h-4 w-4" />
                    Add Chapter
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
