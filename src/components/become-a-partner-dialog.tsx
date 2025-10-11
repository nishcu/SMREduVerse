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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';

const PartnerApplicationSchema = z.object({
  entityName: z.string().min(2, 'Please enter the name of your entity.'),
  entityType: z.enum(['individual', 'organization', 'institution'], {
    required_error: 'Please select your entity type.',
  }),
  areaOfExpertise: z.string().min(5, 'Please describe your area of expertise.'),
  contactName: z.string().min(2, 'Please enter your name.'),
  contactEmail: z.string().email('Please enter a valid email address.'),
  contactMobile: z.string().min(10, 'Please enter a valid mobile number.'),
});

type ApplicationFormValues = z.infer<typeof PartnerApplicationSchema>;

interface BecomeAPartnerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BecomeAPartnerDialog({
  isOpen,
  onOpenChange,
}: BecomeAPartnerDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(PartnerApplicationSchema),
    defaultValues: {
      entityName: '',
      areaOfExpertise: '',
      contactName: '',
      contactEmail: '',
      contactMobile: '',
    },
  });

  const onSubmit = async (data: ApplicationFormValues) => {
      if (!user) {
          toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit an application.' });
          return;
      }

      setIsPending(true);
      try {
          const appRef = await addDoc(collection(db, 'partner-applications'), {
              ...data,
              userId: user.id,
              status: 'pending',
              createdAt: serverTimestamp(),
          });
          
          const userProfileRef = doc(db, `users/${user.id}/profile/${user.id}`);
          await setDoc(userProfileRef, { partnerApplicationId: appRef.id }, { merge: true });

          toast({
              title: 'Application Submitted!',
              description: 'Thank you for your interest. We will review your application and get back to you soon.',
          });
          onOpenChange(false);
          form.reset();
      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: 'Submission Error',
              description: error.message || 'An unknown error occurred.',
          });
      } finally {
          setIsPending(false);
      }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Become a Partner</DialogTitle>
          <DialogDescription>
            Tell us about yourself. We're excited to learn more about you.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
          >
            <FormField
              control={form.control}
              name="entityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of Entity</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Acme Tutoring Inc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Entity</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an entity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="individual">Individual Tutor</SelectItem>
                      <SelectItem value="organization">
                        Organization / Company
                      </SelectItem>
                      <SelectItem value="institution">
                        Educational Institution
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="areaOfExpertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area of Expertise</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., K-12 Mathematics, STEM, Arts & Crafts"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <hr className="my-4" />

            <h4 className="text-sm font-medium">Contact Details</h4>

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person's Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., jane.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Mobile</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="e.g., +91 98765 43210"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="sticky bottom-0 bg-background py-4 -mx-6 px-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isPending || !user
                }
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
