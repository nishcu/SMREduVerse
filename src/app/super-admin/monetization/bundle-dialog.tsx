'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useActionState } from 'react';
import type { CoinBundle } from '@/lib/types';
import { saveCoinBundleAction } from './actions';
import { Loader2 } from 'lucide-react';

const BundleSchema = z.object({
    coins: z.coerce.number().min(1, 'Coins must be greater than 0'),
    price: z.string().min(1, 'Price is required'),
    isPopular: z.boolean(),
});

type BundleFormValues = z.infer<typeof BundleSchema>;

interface BundleDialogProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  bundle: CoinBundle | null;
  onBundleSaved: (bundle: CoinBundle) => void;
}

export function BundleDialog({ isOpen, setOpen, bundle, onBundleSaved }: BundleDialogProps) {
    const [state, formAction, isPending] = useActionState(saveCoinBundleAction, { success: false });
    const { toast } = useToast();

    const form = useForm<BundleFormValues>({
        defaultValues: { coins: 0, price: '', isPopular: false }
    });

    useEffect(() => {
        if (isOpen) {
            if (bundle) {
                form.reset({
                    coins: bundle.coins,
                    price: bundle.price,
                    isPopular: bundle.isPopular || false,
                });
            } else {
                form.reset({ coins: 0, price: '', isPopular: false });
            }
        }
    }, [bundle, form, isOpen]);

    useEffect(() => {
        if (state?.success) {
            toast({ title: 'Success', description: 'Bundle saved successfully.' });
            onBundleSaved({ id: bundle?.id || '', ...form.getValues() });
            setOpen(false);
        } else if (state?.error) {
            toast({ variant: 'destructive', title: 'Error', description: state.error });
        }
    }, [state, bundle, onBundleSaved, setOpen, toast, form]);

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{bundle ? 'Edit Bundle' : 'Create New Bundle'}</DialogTitle>
                    <DialogDescription>Fill in the details for the coin bundle.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form action={formAction} className="space-y-4">
                        <input type="hidden" name="id" value={bundle?.id || ''} />
                        <FormField control={form.control} name="coins" render={({ field }) => (<FormItem><FormLabel>Number of Coins</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input {...field} placeholder="₹199" /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="isPopular" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} name={field.name} /></FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Mark as Popular</FormLabel>
                                    <FormDescription>Highlight this bundle as a popular choice.</FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Bundle
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
