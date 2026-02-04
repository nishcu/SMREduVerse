'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useActionState } from 'react';
import type { SubscriptionPlan } from '@/lib/types';
import { saveSubscriptionPlanAction } from './actions';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

interface PlanDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  onPlanSaved: (plan: SubscriptionPlan) => void;
}

export function PlanDialog({ isOpen, setOpen, plan, onPlanSaved }: PlanDialogProps) {
    const [state, formAction, isPending] = useActionState(saveSubscriptionPlanAction, { success: false });
    const { toast } = useToast();

    const form = useForm({
       defaultValues: { name: '', price: '', pricePeriod: '', features: [''], isPopular: false }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "features"
    });

    useEffect(() => {
        if (isOpen) {
            if (plan) {
                form.reset({
                    name: plan.name,
                    price: plan.price,
                    pricePeriod: plan.pricePeriod,
                    features: plan.features,
                    isPopular: plan.isPopular || false,
                });
            } else {
                form.reset({ name: '', price: '', pricePeriod: '', features: [''], isPopular: false });
            }
        }
    }, [plan, form, isOpen]);

    useEffect(() => {
        if (state?.success) {
            toast({ title: 'Success', description: 'Plan saved successfully.' });
            onPlanSaved({ id: plan?.id || '', ...form.getValues() });
            setOpen(false);
        } else if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, plan, onPlanSaved, setOpen, toast, form]);

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{plan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    <DialogDescription>Fill in the details for the subscription plan.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form action={formAction} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                        <input type="hidden" name="id" value={plan?.id || ''} />
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="pricePeriod" render={({ field }) => (<FormItem><FormLabel>Price Period</FormLabel><FormControl><Input {...field} placeholder="/ month" /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div>
                            <FormLabel>Features</FormLabel>
                            <div className="space-y-2 mt-2">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`features.${index}`}
                                            render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                    <FormControl><Input {...field} name={`features`} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => append('')}><PlusCircle className="mr-2 h-4 w-4" />Add Feature</Button>
                            </div>
                        </div>
                        <FormField control={form.control} name="isPopular" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} name={field.name} /></FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Mark as Popular</FormLabel>
                                    <FormDescription>Highlight this plan as the most popular choice.</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Plan
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
