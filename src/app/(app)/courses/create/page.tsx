
'use client';
import { useEffect, useActionState, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
import { createCourseAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen, Calendar as CalendarIcon, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const subjects = [
    "Mathematics", "Science", "English", "History", "Geography", "Biology", 
    "Chemistry", "Physics", "Computer Science", "Art", "Music", "Mythology", 
    "Entertainment", "General Knowledge", "Current Affairs", 
    "Environmental Science", "Civics", "Economics", "Cooking", 
    "Games & Challenges", "Other"
];

const CourseSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description cannot be empty.').max(500, 'Description must be 500 characters or less.'),
  subject: z.string({ required_error: 'Please select a subject.' }),
  imageUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  duration: z.string().min(1, 'Duration is required.').max(50, 'Duration must be 50 characters or less.'),
  knowledgeCoins: z.coerce.number().min(0, 'Coins must be a positive number.'),
  startDate: z.date({ required_error: 'A start date is required.' }),
  idToken: z.string().min(1, 'Authentication token is required.'),
});

type CourseFormValues = z.infer<typeof CourseSchema>;

const initialState = {
    success: false,
    error: null,
    errors: null,
    courseId: undefined
};

export default function CreateCoursePage() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(createCourseAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<CourseFormValues>({
    defaultValues: {
      title: '',
      description: '',
      subject: 'General Knowledge',
      imageUrl: '',
      duration: '',
      knowledgeCoins: 100,
      startDate: undefined,
      idToken: '',
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
    if (formState.success && formState.courseId) {
      toast({
        title: 'Course Created!',
        description: 'Your new course has been successfully created.',
      });
      router.push(`/courses/${formState.courseId}`);
    }
  }, [formState, router, toast]);

  if (authLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>You must be logged in to create a course.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create a New Course</CardTitle>
          <p className="text-sm text-muted-foreground">Fill out the details below to launch your new course.</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              ref={formRef}
              action={formAction}
              onSubmit={(evt) => {
                const data = form.getValues();
                const formData = new FormData(evt.currentTarget);
                formData.set('startDate', data.startDate.toISOString());
                evt.preventDefault();
                form.handleSubmit(() => {
                    formRef.current?.submit();
                })(evt);
              }}
              className="space-y-6"
            >
              {formState.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error Creating Course</AlertTitle>
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
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Quantum Physics" {...field} />
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
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what students will learn in your course." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 8 Weeks" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="knowledgeCoins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Knowledge Coins</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <input type="hidden" {...form.register('startDate', { setValueAs: (v) => v.toISOString()})} />
              <input type="hidden" {...form.register('idToken')} />


              <Button type="submit" disabled={isPending || !form.watch('idToken')}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create Course
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
