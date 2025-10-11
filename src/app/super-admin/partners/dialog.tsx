'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { savePartnerAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useActionState } from 'react';
import type { Partner } from '@/lib/types';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';

const PartnerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    tagline: z.string().min(1, 'Tagline is required'),
    logoUrl: z.string().url('Invalid URL for logo').optional().or(z.literal('')),
    bannerUrl: z.string().url('Invalid URL for banner').optional().or(z.literal('')),
    websiteUrl: z.string().url('Invalid URL for website').optional().or(z.literal('')),
    promotionalVideoUrl: z.string().url('Invalid URL for video').optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address'),
    description: z.string().min(1, 'Description is required'),
    studentsTaught: z.coerce.number().min(0),
    coursesOffered: z.coerce.number().min(0),
    expertTutors: z.coerce.number().min(0),
    achievements: z.array(z.string()).optional(),
});

type PartnerFormValues = z.infer<typeof PartnerSchema>;

interface PartnerDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  partner: Partner | null;
  onPartnerSaved: (partner: Partner) => void;
}

const initialState: { success: boolean; error?: string | null; errors?: any, data?: Partner | null } = { success: false, error: null, errors: null, data: null };


export function PartnerDialog({ isOpen, setOpen, partner, onPartnerSaved }: PartnerDialogProps) {
  const { firebaseUser } = useAuth();
  const [state, formAction, isPending] = useActionState(savePartnerAction, initialState);
  const { toast } = useToast();

  const form = useForm<PartnerFormValues>({
    mode: 'onBlur',
  });
  
  const { fields: achievementFields, append: appendAchievement, remove: removeAchievement } = useFieldArray({
    control: form.control,
    name: "achievements"
  });

   useEffect(() => {
    if (state?.success && state.data) {
        toast({ title: 'Success', description: `Partner ${partner ? 'updated' : 'created'} successfully.` });
        onPartnerSaved(state.data);
        setOpen(false);
    } else if (state?.error) {
        toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, partner, onPartnerSaved, setOpen, toast]);


  useEffect(() => {
    if (isOpen) {
        form.reset({
            id: partner?.id,
            name: partner?.name || '',
            tagline: partner?.tagline || '',
            logoUrl: partner?.logoUrl || '',
            bannerUrl: partner?.bannerUrl || '',
            websiteUrl: partner?.websiteUrl || '',
            promotionalVideoUrl: partner?.promotionalVideoUrl || '',
            contactEmail: partner?.contactEmail || '',
            description: partner?.description || '',
            studentsTaught: partner?.stats?.studentsTaught || 0,
            coursesOffered: partner?.stats?.coursesOffered || 0,
            expertTutors: partner?.stats?.expertTutors || 0,
            achievements: partner?.achievements || [],
        });
    }
  }, [partner, form, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{partner ? 'Edit Partner' : 'Create New Partner'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the partner organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            action={formAction}
            className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 pl-1"
          >
             <input type="hidden" {...form.register('id')} />
             {form.watch('achievements')?.map((_item, index) => (
                <input key={index} type="hidden" name="achievements" value={form.getValues(`achievements.${index}`)} />
             ))}

            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Partner Name</FormLabel><FormControl><Input placeholder="Acme Tutoring Inc." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="tagline" render={({ field }) => (<FormItem><FormLabel>Tagline</FormLabel><FormControl><Input placeholder="Excellence in Education" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Tell us about this partner..." {...field} /></FormControl><FormMessage /></FormItem>)} />

            <Separator />
            <h4 className="text-base font-semibold">Branding & Media</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bannerUrl" render={({ field }) => (<FormItem><FormLabel>Banner URL</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="websiteUrl" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="promotionalVideoUrl" render={({ field }) => (<FormItem><FormLabel>Promotional Video URL</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />
            <h4 className="text-base font-semibold">Contact</h4>
            <FormField control={form.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
            
            <Separator />
            <h4 className="text-base font-semibold">Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="studentsTaught" render={({ field }) => (<FormItem><FormLabel>Students Taught</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="coursesOffered" render={({ field }) => (<FormItem><FormLabel>Courses Offered</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="expertTutors" render={({ field }) => (<FormItem><FormLabel>Expert Tutors</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />
            <div>
              <FormLabel>Achievements</FormLabel>
              <div className="mt-2 space-y-3">
                {achievementFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`achievements.${index}`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl><Input placeholder="e.g., 'Top Educator Award 2023'" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAchievement(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendAchievement('')}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Achievement
                </Button>
              </div>
            </div>
            <DialogFooter className="sticky bottom-0 bg-background py-4 -mx-6 px-6 border-t">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending || !firebaseUser}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Partner
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
