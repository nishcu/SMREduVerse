
'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createLessonAction } from './actions';
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

const LessonSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.').max(100),
  description: z.string().min(1, 'Description cannot be empty.').max(500),
  contentType: z.enum(['video', 'text', 'pdf', 'presentation']),
  contentUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type LessonFormValues = z.infer<typeof LessonSchema>;


export default function CreateLessonPage({ params }: { params: { id: string, chapterId: string } }) {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(LessonSchema),
    defaultValues: {
      title: '',
      description: '',
      contentType: 'video',
      contentUrl: '',
    },
  });
  
  const onSubmit = async (data: LessonFormValues) => {
    if (!firebaseUser) {
        toast({ variant: 'destructive', title: 'Not authenticated' });
        return;
    }

    setIsPending(true);
    setError(null);
    const idToken = await firebaseUser.getIdToken();
    const result = await createLessonAction({ 
        ...data,
        idToken,
        courseId: params.id,
        chapterId: params.chapterId
    });

    if (result.success) {
      toast({
        title: 'Lesson Created!',
        description: 'Your new lesson has been added to the chapter.',
      });
      router.push(`/courses/${params.id}/chapters/${params.chapterId}/edit`);
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
          <CardTitle className="font-headline text-3xl">Create New Lesson</CardTitle>
          <CardDescription>Add a new lesson to this chapter.</CardDescription>
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
                  <AlertTitle>Error Creating Lesson</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Understanding Gravity" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Description</FormLabel>
                  <FormControl><Textarea placeholder="What is this lesson about?" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="contentType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="contentUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content URL</FormLabel>
                  <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <Button type="submit" disabled={isPending || !firebaseUser}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <><BookPlus className="mr-2 h-4 w-4" /> Add Lesson</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
