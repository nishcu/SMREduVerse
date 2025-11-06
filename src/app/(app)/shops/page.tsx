
'use client';
import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, PlusCircle, Search, Filter, Star, TrendingUp, Sparkles, Grid3x3, List, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { CreateProductDialog } from '@/components/create-product-dialog';
import type { PartnerProduct } from '@/lib/types';
import { getAllProductsAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';

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
  const { user } = useAuth();
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('all');

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
    setProducts(prev => [ { ...newProduct, id: `prod_${Date.now()}` }, ...prev]);
  }

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const nameMatch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const searchMatch = nameMatch || descMatch;

      const categoryMatch = category === 'all' || product.category === category;

      const priceMatch = priceRange === 'all' || 
        (priceRange === 'free' && (!product.priceInCoins || product.priceInCoins === 0) && (!product.priceInRupees || product.priceInRupees === 0)) ||
        (priceRange === 'coins' && product.priceInCoins && product.priceInCoins > 0) ||
        (priceRange === 'rupees' && product.priceInRupees && product.priceInRupees > 0);

      return searchMatch && categoryMatch && priceMatch;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.createdAt as any)?.toMillis?.() - (a.createdAt as any)?.toMillis?.() || 0;
        case 'oldest':
          return (a.createdAt as any)?.toMillis?.() - (b.createdAt as any)?.toMillis?.() || 0;
        case 'price-low':
          const priceA = a.priceInCoins || a.priceInRupees || 0;
          const priceB = b.priceInCoins || b.priceInRupees || 0;
          return priceA - priceB;
        case 'price-high':
          const priceA2 = a.priceInCoins || a.priceInRupees || 0;
          const priceB2 = b.priceInCoins || b.priceInRupees || 0;
          return priceB2 - priceA2;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    // Filter by active tab
    if (activeTab === 'featured') {
      filtered = filtered.filter(p => p.featured);
    } else if (activeTab === 'free') {
      filtered = filtered.filter(p => (!p.priceInCoins || p.priceInCoins === 0) && (!p.priceInRupees || p.priceInRupees === 0));
    } else if (activeTab === 'coins') {
      filtered = filtered.filter(p => p.priceInCoins && p.priceInCoins > 0);
    }

    return filtered;
  }, [products, searchTerm, category, sortBy, priceRange, activeTab]);

  const stats = useMemo(() => {
    const total = products.length;
    const featured = products.filter(p => p.featured).length;
    const free = products.filter(p => (!p.priceInCoins || p.priceInCoins === 0) && (!p.priceInRupees || p.priceInRupees === 0)).length;
    const paid = products.filter(p => (p.priceInCoins && p.priceInCoins > 0) || (p.priceInRupees && p.priceInRupees > 0)).length;
    return { total, featured, free, paid };
  }, [products]);

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
          {user && (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product/Service
            </Button>
          )}
        </div>

        {/* Stats Overview */}
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Products</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    {stats.featured}
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Featured</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.free}</div>
                  <p className="text-xs text-muted-foreground">Free Items</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.paid}</div>
                  <p className="text-xs text-muted-foreground">Paid Items</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        {!isLoading && products.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="coins">Knowledge Coins</SelectItem>
                      <SelectItem value="rupees">Rupees</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List with Tabs */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No products yet</p>
              <p className="text-sm text-muted-foreground mb-4">Be the first to add a product!</p>
              {user && (
                <Button onClick={() => setCreateOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
              <TabsTrigger value="featured">Featured ({stats.featured})</TabsTrigger>
              <TabsTrigger value="free">Free ({stats.free})</TabsTrigger>
              <TabsTrigger value="coins">Knowledge Coins ({stats.paid})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-6">
              {filteredAndSortedProducts.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                  {filteredAndSortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
                    <Button variant="outline" onClick={() => {
                      setSearchTerm('');
                      setCategory('all');
                      setPriceRange('all');
                      setActiveTab('all');
                    }}>Clear Filters</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      {user && (
        <CreateProductDialog 
          isOpen={isCreateOpen} 
          onOpenChange={setCreateOpen} 
          onProductCreated={handleProductCreated as (product: any) => void} 
        />
      )}
    </>
  );
}
