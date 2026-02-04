
'use client';
import { useEffect, useRef, useActionState } from 'react';
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
import { createStudyRoomAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon, XCircle, PlusCircle } from 'lucide-react';
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

const StudyRoomSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty.').max(100, 'Name must be 100 characters or less.'),
  description: z.string().min(1, 'Description cannot be empty.').max(500, 'Description must be 500 characters or less.'),
  subject: z.string({ required_error: 'Please select a subject.' }),
  roomType: z.enum(['chat', 'video', 'audio'], { required_error: 'Please select a room type.' }),
  scheduledAt: z.date({ required_error: 'A date and time for the session is required.' }),
  idToken: z.string().min(1, 'Authentication token is required.'),
});

type RoomFormValues = z.infer<typeof StudyRoomSchema>;

const initialState = {
    success: false,
    error: null,
    errors: null,
    roomId: undefined,
};

export default function CreateStudyRoomPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(createStudyRoomAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(StudyRoomSchema),
    defaultValues: {
      name: '',
      description: '',
      subject: 'General Knowledge',
      roomType: 'chat',
      scheduledAt: new Date(),
      idToken: '',
    },
    mode: 'onChange',
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
    if (formState.success && formState.roomId) {
      toast({
        title: 'Study Room Created!',
        description: 'Your new room has been scheduled.',
      });
      router.push(`/study-rooms`);
    }
  }, [formState, router, toast]);

  if (authLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Create Study Room</CardTitle>
          <CardDescription>
            Host a real-time session for collaborative learning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              ref={formRef}
              action={formAction}
              onSubmit={form.handleSubmit(() => formRef.current?.requestSubmit())}
              className="space-y-6"
            >
              {formState.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error Creating Room</AlertTitle>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quantum Physics Q&A" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the topic and goals of this study session." {...field} />
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
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="chat">Text Chat</SelectItem>
                          <SelectItem value="video">Video Call (coming soon)</SelectItem>
                          <SelectItem value="audio">Audio Call (coming soon)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Schedule Date & Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP p') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                           <div className="p-3 border-t border-border">
                                <Input
                                    type="time"
                                    onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const newDate = new Date(field.value);
                                        newDate.setHours(hours, minutes);
                                        field.onChange(newDate);
                                    }}
                                    value={format(field.value, 'HH:mm')}
                                />
                           </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <input type="hidden" {...form.register('idToken')} />
              <input type="hidden" name="scheduledAt" value={form.watch('scheduledAt')?.toISOString() || ''} />

              <Button type="submit" disabled={isPending || !form.watch('idToken')} className="w-full">
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Create & Schedule Room</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
