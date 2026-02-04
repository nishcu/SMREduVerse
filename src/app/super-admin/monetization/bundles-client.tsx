
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BundleDialog } from './bundle-dialog';
import { deleteCoinBundleAction } from './actions';
import type { CoinBundle } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export function BundlesClient({ initialBundles }: { initialBundles: CoinBundle[] }) {
    const [bundles, setBundles] = useState(initialBundles);
    const [selectedBundle, setSelectedBundle] = useState<CoinBundle | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isAlertOpen, setAlertOpen] = useState(false);
    const [bundleToDelete, setBundleToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const handleCreate = () => {
        setSelectedBundle(null);
        setDialogOpen(true);
    };

    const handleEdit = (bundle: CoinBundle) => {
        setSelectedBundle(bundle);
        setDialogOpen(true);
    };

    const handleDeleteAttempt = (id: string) => {
        setBundleToDelete(id);
        setAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!bundleToDelete) return;
        const result = await deleteCoinBundleAction(bundleToDelete);
        if (result.success) {
            setBundles(bundles.filter(p => p.id !== bundleToDelete));
            toast({ title: 'Success', description: 'Bundle deleted successfully.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setAlertOpen(false);
        setBundleToDelete(null);
    };
    
    const onBundleSaved = (savedBundle: CoinBundle) => {
        const bundleWithId = { ...savedBundle, id: selectedBundle?.id || savedBundle.id || String(Date.now()) };
        if (selectedBundle) {
            setBundles(bundles.map(p => p.id === bundleWithId.id ? bundleWithId : p));
        } else {
            setBundles([bundleWithId, ...bundles].sort((a,b) => a.coins - b.coins));
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Bundle
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Coins</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bundles.map(bundle => (
                            <TableRow key={bundle.id}>
                                <TableCell className="font-medium">
                                    {bundle.coins.toLocaleString()}
                                    {bundle.isPopular && <Badge variant="outline" className="ml-2">Popular</Badge>}
                                </TableCell>
                                <TableCell>{bundle.price}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEdit(bundle)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteAttempt(bundle.id)} className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <BundleDialog isOpen={isDialogOpen} setOpen={setDialogOpen} bundle={selectedBundle} onBundleSaved={onBundleSaved} />
            
            <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the coin bundle.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
