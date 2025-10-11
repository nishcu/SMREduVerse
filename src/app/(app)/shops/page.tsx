
'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, PlusCircle } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { CreateProductDialog } from '@/components/create-product-dialog';
import type { PartnerProduct } from '@/lib/types';
import { getAllProductsAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

function ProductCardSkeleton() {
    return (
        <Card className="flex flex-col">
            <CardHeader className="p-0">
                 <Skeleton className="aspect-video w-full" />
            </CardHeader>
            <CardContent className="p-4 flex-grow space-y-2">
                 <Skeleton className="h-6 w-3/4" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-1/2" />
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
        setIsLoading(true);
        const result = await getAllProductsAction();
        if (result.success && result.data) {
            setProducts(result.data);
        }
        setIsLoading(false);
    }
    fetchProducts();
  }, []);

  const handleProductCreated = (newProduct: PartnerProduct) => {
    // In a real app, this would re-fetch data. For now, we just add to the local state.
    setProducts(prev => [ { ...newProduct, id: `prod_${Date.now()}` }, ...prev]);
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShoppingBag className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                Marketplace
              </h1>
              <p className="text-muted-foreground">
                Browse virtual items and services offered by our partners.
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product/Service
          </Button>
        </div>
        
        {isLoading ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-16">
            <p>The marketplace is empty right now. Check back soon!</p>
          </div>
        )}
      </div>
      <CreateProductDialog 
        isOpen={isCreateOpen} 
        onOpenChange={setCreateOpen} 
        onProductCreated={handleProductCreated as (product: any) => void} 
      />
    </>
  );
}
