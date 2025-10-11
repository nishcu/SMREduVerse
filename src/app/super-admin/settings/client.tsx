'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { EconomySettings } from '@/lib/types';
import { saveEconomySettingsAction } from './actions';

export function EconomySettingsClient({ initialSettings }: { initialSettings: EconomySettings | null }) {
  const [state, formAction, isPending] = useActionState(saveEconomySettingsAction, { success: false });
  const { toast } = useToast();

  const form = useForm({
    defaultValues: initialSettings || {
      rewardForGameWin: 50,
      rewardForPostCreation: 5,
      rewardForCourseCompletion: 100,
      signupBonus: 100,
      referralBonus: 200,
      costForAITask: 10,
      coinsPerRupee: 100,
      platformFeePercent: 15,
    },
  });

  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Success', description: 'Economy settings have been updated.' });
    } else if (state?.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        <div>
            <h3 className="text-lg font-medium mb-4">Earning Coins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="signupBonus" render={({ field }) => (<FormItem><FormLabel>Signup Bonus</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Coins new users receive.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="referralBonus" render={({ field }) => (<FormItem><FormLabel>Referral Bonus</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Coins for successful referrals.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForGameWin" render={({ field }) => (<FormItem><FormLabel>Game Win Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Coins for winning a daily game.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForPostCreation" render={({ field }) => (<FormItem><FormLabel>Post Creation Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Coins for creating a new post.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForCourseCompletion" render={({ field }) => (<FormItem><FormLabel>Course Completion Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Coins for completing a course.</FormDescription><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium mb-4">Spending Coins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="costForAITask" render={({ field }) => (<FormItem><FormLabel>AI Task Generation Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for Brain Lab task generation.</FormDescription><FormMessage /></FormItem>)} />
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-medium mb-4">Platform & Conversion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="coinsPerRupee" render={({ field }) => (<FormItem><FormLabel>Coins per Rupee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Conversion for payout value (e.g., 100 = ₹1).</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="platformFeePercent" render={({ field }) => (<FormItem><FormLabel>Platform Fee (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Commission on partner/tutor sales.</FormDescription><FormMessage /></FormItem>)} />
            </div>
        </div>
        
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </Form>
  );
}
