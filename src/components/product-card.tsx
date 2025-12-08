
'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Coins, Loader2, ShoppingBag, Star, Sparkles, Tag } from 'lucide-react';
import type { PartnerProduct } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: PartnerProduct;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
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

    if (viewMode === 'list') {
        return (
            <Card className="flex flex-row overflow-hidden">
                <CardHeader className="p-0 w-48 shrink-0">
                    <div className="relative aspect-video w-full h-full">
                        <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                        {product.featured && (
                            <Badge className="absolute top-2 right-2" variant="default">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Featured
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <CardTitle className="text-lg font-headline line-clamp-2">{product.title}</CardTitle>
                            {product.featured && (
                                <Badge variant="default" className="shrink-0">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Featured
                                </Badge>
                            )}
                        </div>
                        {product.category && (
                            <Badge variant="outline" className="mb-2 text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {product.category}
                            </Badge>
                        )}
                        <CardDescription className="text-sm mt-2 line-clamp-2">{product.description}</CardDescription>
                        {product.rating && (
                            <div className="flex items-center gap-1 mt-2">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-semibold">{product.rating.toFixed(1)}</span>
                                {product.reviewsCount && (
                                    <span className="text-xs text-muted-foreground">({product.reviewsCount})</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 mt-4">
                        {product.priceInRupees && (
                            <Button className="flex-1" onClick={() => handlePurchase('rupees')} disabled={isPurchasing}>
                                {isPurchasing ? <Loader2 className="animate-spin h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                                <span className="ml-2">₹{product.priceInRupees.toLocaleString()}</span>
                            </Button>
                        )}
                        {product.priceInCoins && (
                            <Button variant="secondary" className="flex-1" onClick={() => handlePurchase('coins')} disabled={isPurchasing}>
                                {isPurchasing ? <Loader2 className="animate-spin h-4 w-4" /> : <Coins className="h-4 w-4" />}
                                <span className="ml-2">{product.priceInCoins.toLocaleString()} Coins</span>
                            </Button>
                        )}
                        {!product.priceInRupees && !product.priceInCoins && (
                            <Button className="flex-1" variant="outline" disabled>
                                Free
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col overflow-hidden group hover:shadow-lg transition-shadow">
            <CardHeader className="p-0 relative">
                <div className="relative aspect-video w-full">
                    <Image src={product.imageUrl} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    {product.featured && (
                        <Badge className="absolute top-2 right-2" variant="default">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Featured
                        </Badge>
                    )}
                    {product.category && (
                        <Badge variant="secondary" className="absolute top-2 left-2">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.category}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg font-headline line-clamp-2 flex-1">{product.title}</CardTitle>
                </div>
                {product.rating && (
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{product.rating.toFixed(1)}</span>
                        {product.reviewsCount && (
                            <span className="text-xs text-muted-foreground">({product.reviewsCount})</span>
                        )}
                    </div>
                )}
                <CardDescription className="text-sm mt-1 line-clamp-2">{product.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                {product.priceInRupees && (
                    <Button className="w-full" onClick={() => handlePurchase('rupees')} disabled={isPurchasing}>
                        {isPurchasing ? <Loader2 className="animate-spin h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                        <span className="ml-2">Buy for ₹{product.priceInRupees.toLocaleString()}</span>
                    </Button>
                )}
                {product.priceInCoins && (
                     <Button variant="secondary" className="w-full" onClick={() => handlePurchase('coins')} disabled={isPurchasing}>
                        {isPurchasing ? <Loader2 className="animate-spin h-4 w-4" /> : <Coins className="h-4 w-4" />}
                        <span className="ml-2">Redeem for {product.priceInCoins.toLocaleString()} Coins</span>
                    </Button>
                )}
                {!product.priceInRupees && !product.priceInCoins && (
                    <Button className="w-full" variant="outline" disabled>
                        Free
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
