
'use client';
import React from 'react';
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
import { getEconomySettingsAction, saveEconomySettingsAction } from './actions';

export function EconomySettingsClient() {
  const [state, formAction, isPending] = useActionState(saveEconomySettingsAction, { success: false });
  const { toast } = useToast();
  const [initialSettings, setInitialSettings] = React.useState<EconomySettings | null>(null);

  const form = useForm({
    defaultValues: initialSettings || {
      rewardForGameWin: 50,
      rewardForPostCreation: 5,
      rewardForCourseCompletion: 100,
      signupBonus: 100,
      referralBonus: 200,
      costForAITask: 10,
      costToJoinChallenge: 50,
      costToHostChallenge: 200,
      costToJoinContest: 100,
      costToHostContest: 500,
      costToJoinStudyRoom: 10,
      costToCreateStudyRoom: 50,
      costToJoinGame: 20,
      rewardForChallengeWin: 100,
      rewardForChallengeSecond: 50,
      rewardForChallengeThird: 25,
      rewardForContestWin: 500,
      rewardForContestSecond: 250,
      rewardForContestThird: 100,
      hostEarningPercent: 15,
      participantFeePercent: 15,
      coinsPerRupee: 100,
      platformFeePercent: 10,
    },
  });

  useEffect(() => {
    getEconomySettingsAction().then(settings => {
      if (settings) {
        setInitialSettings(settings);
        form.reset(settings);
      }
    });
  }, [form]);

  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Success', description: 'Economy settings have been updated.' });
      if (state.data) {
        form.reset(state.data);
      }
    } else if (state?.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast, form]);

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
            <h3 className="text-lg font-medium mb-4">Activity Participation Costs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="costToJoinChallenge" render={({ field }) => (<FormItem><FormLabel>Join Challenge Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for participants to join a challenge.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="costToHostChallenge" render={({ field }) => (<FormItem><FormLabel>Host Challenge Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for users to create/host a challenge.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="costToJoinContest" render={({ field }) => (<FormItem><FormLabel>Join Contest Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for participants to join a contest.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="costToHostContest" render={({ field }) => (<FormItem><FormLabel>Host Contest Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for users to create/host a contest.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="costToJoinStudyRoom" render={({ field }) => (<FormItem><FormLabel>Join Study Room Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for participants to join a study room.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="costToCreateStudyRoom" render={({ field }) => (<FormItem><FormLabel>Create Study Room Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for users to create a study room.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="costToJoinGame" render={({ field }) => (<FormItem><FormLabel>Join Game Cost</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Cost for participants to join multiplayer games.</FormDescription><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium mb-4">Winner Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="rewardForChallengeWin" render={({ field }) => (<FormItem><FormLabel>Challenge 1st Place Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Base reward for winning a challenge.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForChallengeSecond" render={({ field }) => (<FormItem><FormLabel>Challenge 2nd Place Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Base reward for 2nd place in challenge.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForChallengeThird" render={({ field }) => (<FormItem><FormLabel>Challenge 3rd Place Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Base reward for 3rd place in challenge.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForContestWin" render={({ field }) => (<FormItem><FormLabel>Contest 1st Place Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Base reward for winning a contest.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForContestSecond" render={({ field }) => (<FormItem><FormLabel>Contest 2nd Place Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Base reward for 2nd place in contest.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="rewardForContestThird" render={({ field }) => (<FormItem><FormLabel>Contest 3rd Place Reward</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Base reward for 3rd place in contest.</FormDescription><FormMessage /></FormItem>)} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium mb-4">Host Earnings & Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="hostEarningPercent" render={({ field }) => (<FormItem><FormLabel>Host Earning (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Percentage of participant fees that host earns.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="participantFeePercent" render={({ field }) => (<FormItem><FormLabel>Host Fee Share (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Percentage of entry fee that goes to host (rest to prize pool).</FormDescription><FormMessage /></FormItem>)} />
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-medium mb-4">Platform & Conversion</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="coinsPerRupee" render={({ field }) => (<FormItem><FormLabel>Coins per Rupee</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Conversion for payout value (e.g., 100 = ₹1).</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="platformFeePercent" render={({ field }) => (<FormItem><FormLabel>Platform Fee (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Platform commission on all earnings.</FormDescription><FormMessage /></FormItem>)} />
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
