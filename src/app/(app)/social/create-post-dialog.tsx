'use client';

import { useEffect, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { createPostAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const subjects = [
    "Mathematics", "Science", "English", "History", "Geography", "Biology", 
    "Chemistry", "Physics", "Computer Science", "Art", "Music", "Mythology", 
    "Entertainment", "General Knowledge", "Current Affairs", 
    "Environmental Science", "Civics", "Economics", "Cooking", 
    "Games & Challenges", "Other"
];

const initialState: { success: boolean; error?: string | null; errors?: any } = {
  success: false,
};

export function CreatePostDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const { user, getInitials, firebaseUser } = useAuth();
  const [state, formAction, isPending] = useActionState(createPostAction, initialState);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      content: '',
      imageUrl: '',
      postType: 'text',
      subject: 'General Knowledge',
    },
  });

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Post Created!',
        description: 'Your post has been successfully shared.',
      });
      onOpenChange(false);
      form.reset();
    } else if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Post',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange, form]);
    
  if (!user) return null;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, ask questions, or post updates.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form
                action={async (formData: FormData) => {
                    if (!firebaseUser) return;
                    const idToken = await firebaseUser.getIdToken();
                    formData.set('idToken', idToken);
                    formAction(formData);
                }}
                className="space-y-4"
            >
                <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-2">
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                <FormControl>
                                    <Textarea
                                        placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
                                        className="w-full border-none focus-visible:ring-0 text-base resize-none"
                                        rows={4}
                                        {...field}
                                        />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

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
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="postType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Post Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select post type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="question">Question</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
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
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button type="submit" disabled={isPending || !firebaseUser}>
                        {isPending ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                            </>
                        ) : (
                            'Post'
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
