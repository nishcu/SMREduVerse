'use client';

import { useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createChallengeAction } from './actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CreateChallengeSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description is required.').max(500, 'Description must be 500 characters or less.'),
  type: z.enum(['course_completion', 'subject_mastery', 'daily_goal', 'time_based', 'custom']),
  targetCourseId: z.string().optional(),
  targetSubject: z.string().optional(),
  targetGoal: z.string().optional(),
  targetDuration: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().optional(),
  rewardsCoins: z.string().regex(/^\d+$/, 'Must be a number.').or(z.literal('0')),
  rewardsPoints: z.string().regex(/^\d+$/, 'Must be a number.').or(z.literal('0')),
  rewardsBadge: z.string().optional(),
});

type CreateChallengeFormValues = z.infer<typeof CreateChallengeSchema>;

interface CreateChallengeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateChallengeDialog({ isOpen, onOpenChange }: CreateChallengeDialogProps) {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(createChallengeAction, { success: false, error: null });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const form = useForm<CreateChallengeFormValues>({
    resolver: zodResolver(CreateChallengeSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'course_completion',
      targetCourseId: '',
      targetSubject: '',
      targetGoal: '',
      targetDuration: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      rewardsCoins: '100',
      rewardsPoints: '50',
      rewardsBadge: '',
    },
  });

  if (state?.success && hasSubmitted) {
    toast({ title: 'Success', description: 'Challenge created successfully!' });
    form.reset();
    setHasSubmitted(false);
    onOpenChange(false);
  } else if (state?.error && hasSubmitted && state.error !== 'Invalid form data.') {
    toast({ variant: 'destructive', title: 'Error', description: state.error });
    setHasSubmitted(false);
  }

  const onSubmit = async (values: CreateChallengeFormValues) => {
    if (!firebaseUser) return;

    setHasSubmitted(true);
    const idToken = await firebaseUser.getIdToken();
    
    const formData = new FormData();
    formData.set('idToken', idToken);
    formData.set('title', values.title);
    formData.set('description', values.description);
    formData.set('type', values.type);
    if (values.targetCourseId) formData.set('target.courseId', values.targetCourseId);
    if (values.targetSubject) formData.set('target.subject', values.targetSubject);
    if (values.targetGoal) formData.set('target.goal', values.targetGoal);
    if (values.targetDuration) formData.set('target.duration', values.targetDuration);
    formData.set('startDate', new Date(values.startDate).toISOString());
    if (values.endDate) formData.set('endDate', new Date(values.endDate).toISOString());
    formData.set('rewards.coins', values.rewardsCoins);
    formData.set('rewards.points', values.rewardsPoints);
    if (values.rewardsBadge) formData.set('rewards.badge', values.rewardsBadge);

    formAction(formData);
  };

  const challengeType = form.watch('type');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Learning Challenge</DialogTitle>
          <DialogDescription>
            Create a challenge to motivate yourself and others to learn together!
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Complete Python Basics in 30 Days" {...field} />
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
                    <Textarea placeholder="Join me in mastering Python fundamentals..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select challenge type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="course_completion">Course Completion</SelectItem>
                      <SelectItem value="subject_mastery">Subject Mastery</SelectItem>
                      <SelectItem value="daily_goal">Daily Goal</SelectItem>
                      <SelectItem value="time_based">Time-Based</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {challengeType === 'course_completion' && (
              <FormField
                control={form.control}
                name="targetCourseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course ID</FormLabel>
                    <FormControl>
                      <Input placeholder="course_math_101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {challengeType === 'subject_mastery' && (
              <FormField
                control={form.control}
                name="targetSubject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Mathematics, Science, History..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {challengeType === 'daily_goal' && (
              <FormField
                control={form.control}
                name="targetGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Goal</FormLabel>
                    <FormControl>
                      <Input placeholder="Study 2 hours daily" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {challengeType === 'time_based' && (
              <FormField
                control={form.control}
                name="targetDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Rewards</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rewardsCoins"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Knowledge Coins</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rewardsPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Knowledge Points</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rewardsBadge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Badge (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Python Master" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Challenge
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

