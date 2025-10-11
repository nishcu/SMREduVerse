'use client';

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
import { useEffect, useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { createPartnerApplicationAction } from '@/app/super-admin/partners/actions';
import { useAuth } from '@/hooks/use-auth';

const PartnerApplicationSchema = z.object({
  entityName: z.string().min(2, 'Please enter the name of your entity.'),
  entityType: z.enum(['individual', 'organization', 'institution'], {
    required_error: 'Please select your entity type.',
  }),
  areaOfExpertise: z.string().min(5, 'Please describe your area of expertise.'),
  contactName: z.string().min(2, 'Please enter your name.'),
  contactEmail: z.string().email('Please enter a valid email address.'),
  contactMobile: z.string().min(10, 'Please enter a valid mobile number.'),
  idToken: z.string().min(1, 'idToken is required'),
});

type ApplicationFormValues = z.infer<typeof PartnerApplicationSchema>;

interface BecomeAPartnerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState = { success: false, error: null, errors: null };

export function BecomeAPartnerDialog({
  isOpen,
  onOpenChange,
}: BecomeAPartnerDialogProps) {
  const [state, formAction, isPending] = useActionState(
    createPartnerApplicationAction,
    initialState
  );
  const { toast } = useToast();
  const { firebaseUser } = useAuth();

  const form = useForm<ApplicationFormValues>({
    defaultValues: {
      entityName: '',
      areaOfExpertise: '',
      contactName: '',
      contactEmail: '',
      contactMobile: '',
      idToken: '',
    },
  });

  useEffect(() => {
    if (firebaseUser) {
      firebaseUser.getIdToken().then((token) => {
        form.setValue('idToken', token);
      });
    }
  }, [firebaseUser, form]);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Application Submitted!',
        description:
          'Thank you for your interest. We will review your application and get back to you soon.',
      });
      onOpenChange(false);
      form.reset();
    } else if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
  }, [state, onOpenChange, form, toast]);

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
            action={formAction}
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
                    name={field.name}
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

            <input type="hidden" {...form.register('idToken')} />

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
                  isPending ||
                  !form.watch('idToken')
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
