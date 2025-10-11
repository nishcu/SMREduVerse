
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { collection, doc, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Quest, type UserQuestProgress } from '@/lib/types';
import * as LucideIcons from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { completeQuestAction, resetProgressAction } from './actions';
import { useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useDoc } from '@/firebase';
import { useActionState } from 'react';

function QuestCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function QuestCard({ quest, isCompleted, onComplete, isPending }: { quest: Quest, isCompleted: boolean, onComplete: (questId: string) => void, isPending: boolean }) {
  const Icon = (LucideIcons as any)[quest.icon] || LucideIcons.HelpCircle;

  return (
    <Card className={`flex flex-col transition-all ${isCompleted ? 'bg-muted/50' : 'bg-card'}`}>
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isCompleted ? 'bg-primary/20' : 'bg-primary'}`}>
            <Icon className={`h-6 w-6 ${isCompleted ? 'text-primary' : 'text-primary-foreground'}`} />
        </div>
        <div className='flex-1'>
            <CardTitle>{quest.name}</CardTitle>
            <CardDescription>{quest.subject} - {quest.difficulty}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{quest.description}</p>
      </CardContent>
      <CardFooter>
        <form action={() => onComplete(quest.id)} className="w-full">
            <Button className="w-full" disabled={isCompleted || isPending}>
            {isCompleted ? (
                <><LucideIcons.CheckCircle className="mr-2 h-4 w-4" /> Completed</>
            ) : (
                'Mark as Complete'
            )}
            </Button>
        </form>
      </CardFooter>
    </Card>
  );
}


export default function BrainQuestPage() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  
  const [completeQuestState, completeQuestFormAction, isCompleteQuestPending] = useActionState(completeQuestAction, { success: false });
  const [resetState, resetFormAction, isResetPending] = useActionState(resetProgressAction, { success: false });
  
  const isPending = isCompleteQuestPending || isResetPending;

  const questsQuery = useMemo(() => collection(db, 'quests'), []);
  const { data: quests, loading: loadingQuests, error: errorQuests } = useCollection<Quest>(questsQuery);
  
  const progressRef = useMemo(() => firebaseUser ? doc(db, `users/${firebaseUser.uid}/quest-progress/main`) : null, [firebaseUser]);
  const { data: progress, loading: loadingProgress, error: errorProgress } = useDoc<UserQuestProgress>(progressRef as DocumentReference<UserQuestProgress> | null);

  const completedQuests = progress?.completedQuests || [];

  const handleCompleteQuest = async (questId: string) => {
    if (!firebaseUser) return;
    const idToken = await firebaseUser.getIdToken();
    
    const formData = new FormData();
    formData.append('idToken', idToken);
    formData.append('questId', questId);
    
    completeQuestFormAction(formData);
  }
  
  useEffect(() => {
    if (completeQuestState?.success) {
      toast({ title: 'Quest Complete!', description: 'Your progress has been saved.' });
    } else if(completeQuestState?.error) {
       toast({ variant: 'destructive', title: 'Error', description: completeQuestState.error });
    }
  }, [completeQuestState, toast]);

  useEffect(() => {
    if (resetState?.success) {
        toast({ title: 'Progress Reset!', description: 'Your quest adventure begins anew.' });
    } else if (resetState?.error) {
        toast({ variant: 'destructive', title: 'Error', description: resetState.error });
    }
  }, [resetState, toast]);

  const isLoading = loadingQuests || loadingProgress;
  const error = errorQuests || errorProgress;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            Brain Quest Adventure
          </h1>
          <p className="text-muted-foreground">
            Explore the world of knowledge and complete quests to earn rewards.
          </p>
        </div>
        <form action={resetFormAction}>
            <input type="hidden" name="idToken" value={firebaseUser?.uid || ''} />
            <Button type="submit" variant="outline" disabled={isPending || !firebaseUser}>Reset Progress</Button>
        </form>
      </div>

      {error && (
         <Alert variant="destructive">
            <AlertTitle>Error Loading Quests</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
         <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {[...Array(5)].map((_, i) => <QuestCardSkeleton key={i} />)}
         </div>
      ) : quests && quests.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quests?.map(quest => (
            <QuestCard 
                key={quest.id} 
                quest={quest}
                isCompleted={completedQuests.includes(quest.id)}
                onComplete={handleCompleteQuest}
                isPending={isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
          <p className="text-lg font-medium">The adventure awaits!</p>
          <p>It seems there are no quests loaded yet. An administrator can add them from the settings panel.</p>
        </div>
      )}
    </div>
  );
}
