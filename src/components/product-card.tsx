
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2, ShoppingBag } from 'lucide-react';
import type { PartnerProduct } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ProductCard({ product }: { product: PartnerProduct }) {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { toast } = useToast();

    const handlePurchase = async (currency: 'rupees' | 'coins') => {
        setIsPurchasing(true);
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
            title: 'Purchase Successful!',
            description: `You have purchased "${product.title}".`,
        });
        
        setIsPurchasing(false);
    };

    return (
        <Card className="flex flex-col overflow-hidden">
            <CardHeader className="p-0">
                <div className="relative aspect-video w-full">
                    <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg font-headline">{product.title}</CardTitle>
                <CardDescription className="text-sm mt-1">{product.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                {product.priceInRupees && (
                    <Button className="w-full" onClick={() => handlePurchase('rupees')} disabled={isPurchasing}>
                        {isPurchasing ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
                        Buy for ₹{product.priceInRupees.toLocaleString()}
                    </Button>
                )}
                {product.priceInCoins && (
                     <Button variant="secondary" className="w-full" onClick={() => handlePurchase('coins')} disabled={isPurchasing}>
                        {isPurchasing ? <Loader2 className="animate-spin" /> : <Coins />}
                        Redeem for {product.priceInCoins.toLocaleString()} Coins
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
