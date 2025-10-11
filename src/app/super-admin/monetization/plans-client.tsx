
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlanDialog } from './plan-dialog';
import { deleteSubscriptionPlanAction } from './actions';
import type { SubscriptionPlan } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export function PlansClient({ initialPlans }: { initialPlans: SubscriptionPlan[] }) {
    const [plans, setPlans] = useState(initialPlans);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isAlertOpen, setAlertOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const handleCreate = () => {
        setSelectedPlan(null);
        setDialogOpen(true);
    };

    const handleEdit = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setDialogOpen(true);
    };

    const handleDeleteAttempt = (id: string) => {
        setPlanToDelete(id);
        setAlertOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!planToDelete) return;
        const result = await deleteSubscriptionPlanAction(planToDelete);
        if (result.success) {
            setPlans(plans.filter(p => p.id !== planToDelete));
            toast({ title: 'Success', description: 'Plan deleted successfully.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setAlertOpen(false);
        setPlanToDelete(null);
    };
    
    const onPlanSaved = (savedPlan: SubscriptionPlan) => {
        const planWithId = { ...savedPlan, id: selectedPlan?.id || savedPlan.id || String(Date.now()) };
        if (selectedPlan) {
            setPlans(plans.map(p => p.id === planWithId.id ? planWithId : p));
        } else {
            setPlans([planWithId, ...plans]);
        }
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={handleCreate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Plan
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Features</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map(plan => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">
                                    {plan.name}
                                    {plan.isPopular && <Badge variant="outline" className="ml-2">Popular</Badge>}
                                </TableCell>
                                <TableCell>{plan.price}{plan.pricePeriod}</TableCell>
                                <TableCell className="max-w-xs truncate">{plan.features.join(', ')}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEdit(plan)}>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteAttempt(plan.id)} className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <PlanDialog isOpen={isDialogOpen} setOpen={setDialogOpen} plan={selectedPlan} onPlanSaved={onPlanSaved} />
            
            <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the subscription plan.</AlertDialogDescription>
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
