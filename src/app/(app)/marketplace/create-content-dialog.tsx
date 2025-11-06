'use client';

import { useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createMarketplaceContentAction } from './actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CreateContentSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200, 'Title must be 200 characters or less.'),
  description: z.string().min(1, 'Description is required.').max(1000, 'Description must be 1000 characters or less.'),
  type: z.enum(['study_notes', 'video_tutorial', 'practice_quiz', 'flashcards', 'study_guide']),
  subject: z.string().min(1, 'Subject is required.'),
  grade: z.string().optional(),
  fileUrl: z.string().url().optional().or(z.literal('')),
  content: z.string().optional(),
  price: z.string().regex(/^\d+$/, 'Must be a number.').or(z.literal('0')),
  tags: z.array(z.string()).optional(),
});

type CreateContentFormValues = z.infer<typeof CreateContentSchema>;

interface CreateContentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContentDialog({ isOpen, onOpenChange }: CreateContentDialogProps) {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(createMarketplaceContentAction, { success: false, error: null });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<CreateContentFormValues>({
    resolver: zodResolver(CreateContentSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'study_notes',
      subject: '',
      grade: '',
      fileUrl: '',
      content: '',
      price: '0',
      tags: [],
    },
  });

  const tags = form.watch('tags') || [];

  if (state?.success && hasSubmitted) {
    toast({ title: 'Success', description: 'Content created successfully!' });
    form.reset();
    setHasSubmitted(false);
    onOpenChange(false);
  } else if (state?.error && hasSubmitted && state.error !== 'Invalid form data.') {
    toast({ variant: 'destructive', title: 'Error', description: state.error });
    setHasSubmitted(false);
  }

  const onSubmit = async (values: CreateContentFormValues) => {
    if (!firebaseUser) return;

    setHasSubmitted(true);
    const idToken = await firebaseUser.getIdToken();
    
    const formData = new FormData();
    formData.set('idToken', idToken);
    formData.set('title', values.title);
    formData.set('description', values.description);
    formData.set('type', values.type);
    formData.set('subject', values.subject);
    if (values.grade) formData.set('grade', values.grade);
    if (values.fileUrl) formData.set('content.fileUrl', values.fileUrl);
    if (values.content) formData.set('content.content', values.content);
    formData.set('price', values.price);
    values.tags?.forEach(tag => formData.append('tags[]', tag));

    formAction(formData);
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter(t => t !== tag));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Marketplace Content</DialogTitle>
          <DialogDescription>
            Share your knowledge and earn knowledge coins!
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Complete Algebra Notes - Chapter 1" {...field} />
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
                    <Textarea placeholder="Detailed notes covering..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="study_notes">Study Notes</SelectItem>
                        <SelectItem value="video_tutorial">Video Tutorial</SelectItem>
                        <SelectItem value="practice_quiz">Practice Quiz</SelectItem>
                        <SelectItem value="flashcards">Flashcards</SelectItem>
                        <SelectItem value="study_guide">Study Guide</SelectItem>
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
                    <FormControl>
                      <Input placeholder="Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade/Level (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="10th Grade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/file.pdf" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Text content here..." {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (Knowledge Coins)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Content
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

