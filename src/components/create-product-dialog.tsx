
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const ProductSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'Description is required.'),
    imageUrl: z.string().url('Please enter a valid image URL.'),
    priceInRupees: z.coerce.number().min(0).optional(),
    priceInCoins: z.coerce.number().min(0).optional(),
}).refine(data => data.priceInRupees || data.priceInCoins, {
    message: 'At least one price (Rupees or Coins) must be set.',
    path: ['priceInRupees'],
});

type ProductFormValues = z.infer<typeof ProductSchema>;

interface CreateProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated: (product: ProductFormValues) => void;
}

export function CreateProductDialog({ isOpen, onOpenChange, onProductCreated }: CreateProductDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: 'https://picsum.photos/seed/new-product/400/225',
      priceInRupees: undefined,
      priceInCoins: undefined,
    }
  });

  const onSubmit = async (data: ProductFormValues) => {
    setIsPending(true);
    // In a real app, this would be a server action.
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onProductCreated(data);
    
    toast({
      title: 'Product Created!',
      description: `"${data.title}" has been added to the marketplace.`,
    });
    
    setIsPending(false);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add a New Product or Service</DialogTitle>
          <DialogDescription>
            Fill in the details for your new marketplace item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., '1-on-1 Tutoring Session'" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the product or service..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="priceInRupees" render={({ field }) => (<FormItem><FormLabel>Price in Rupees (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="priceInCoins" render={({ field }) => (<FormItem><FormLabel>Price in Coins (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 2500" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Marketplace
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
