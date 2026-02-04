'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { saveContestAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useActionState } from 'react';
import type { Contest } from '@/lib/types';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ContestSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    entryFee: z.coerce.number().min(0, 'Entry fee must be a positive number'),
    prize: z.coerce.number().min(0, 'Prize must be a positive number'),
    status: z.enum(['upcoming', 'live', 'finished']),
    startDate: z.date(),
    endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
});

type ContestFormValues = z.infer<typeof ContestSchema>;

interface ContestDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  contest: Contest | null;
  onContestSaved: (contest: Contest) => void;
}

export function ContestDialog({ isOpen, setOpen, contest, onContestSaved }: ContestDialogProps) {
  const [state, formAction, isPending] = useActionState(saveContestAction, null);
  const { toast } = useToast();
  
  const form = useForm<ContestFormValues>({
    resolver: zodResolver(ContestSchema),
    defaultValues: {
      title: '',
      description: '',
      entryFee: 0,
      prize: 100,
      status: 'upcoming',
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    }
  });

  useEffect(() => {
    if (contest) {
      form.reset({
        title: contest.title,
        description: contest.description,
        entryFee: contest.entryFee,
        prize: contest.prize,
        status: contest.status,
        startDate: new Date(contest.startDate),
        endDate: new Date(contest.endDate),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        entryFee: 0,
        prize: 100,
        status: 'upcoming',
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      });
    }
  }, [contest, form, isOpen]);

  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Success', description: `Contest ${contest ? 'updated' : 'created'} successfully.` });
      setOpen(false);
      // This is a bit of a hack, but it works to refresh the list
      onContestSaved({ ...form.getValues(), id: contest?.id || Math.random().toString(), participantCount: contest?.participantCount || 0, startDate: form.getValues().startDate.toISOString(), endDate: form.getValues().endDate.toISOString() });
    } else if (state?.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, contest, onContestSaved, setOpen, toast, form]);

  const onSubmit = (data: ContestFormValues) => {
    const formData = new FormData();
    if (contest) {
      formData.append('id', contest.id);
    }
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('entryFee', String(data.entryFee));
    formData.append('prize', String(data.prize));
    formData.append('status', data.status);
    formData.append('startDate', data.startDate.toISOString());
    formData.append('endDate', data.endDate.toISOString());

    formAction(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contest ? 'Edit Contest' : 'Create New Contest'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the contest. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
                <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Entry Fee (Coins)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="prize"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Prize (Coins)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Contest
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
