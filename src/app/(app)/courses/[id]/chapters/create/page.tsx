
'use client';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
});

type ChapterFormValues = z.infer<typeof ChapterSchema>;


export default function CreateChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(ChapterSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: ChapterFormValues) => {
    if (!firebaseUser) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }
    setIsPending(true);
    setError(null);
    const idToken = await firebaseUser.getIdToken();
    const result = await createChapterAction({ ...data, courseId: id, idToken });

    if (result.success) {
        toast({
            title: 'Chapter Created!',
            description: 'Your new chapter has been added to the course.',
        });
        router.push(`/courses/${id}/edit`);
    } else {
        setError(result.error || 'An unknown error occurred.');
    }
    setIsPending(false);
  };


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
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error Creating Chapter</AlertTitle>
                  <AlertDescription>
                    {error}
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
              
              <Button type="submit" disabled={isPending || !firebaseUser}>
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
