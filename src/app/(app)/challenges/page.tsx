'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trophy, Users, Target, Calendar, Award, TrendingUp } from 'lucide-react';
import { CreateChallengeDialog } from './create-challenge-dialog';
import { ChallengeCard } from './challenge-card';
import { Skeleton } from '@/components/ui/skeleton';
import { getChallengesAction, getUserChallengesAction } from './actions';
import type { LearningChallenge } from '@/lib/types';

function ChallengeSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function ChallengesPage() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [allChallenges, setAllChallenges] = useState<LearningChallenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<LearningChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadChallenges();
  }, [firebaseUser, activeTab]);

  const loadChallenges = async () => {
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const idToken = await firebaseUser.getIdToken();

      if (activeTab === 'all') {
        const result = await getChallengesAction(idToken, 20);
        if (result.success) {
          setAllChallenges(result.challenges as any);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to load challenges.',
          });
        }
      } else {
        const result = await getUserChallengesAction(idToken);
        if (result.success) {
          setMyChallenges(result.challenges as any);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error || 'Failed to load your challenges.',
          });
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load challenges.',
      });
    } finally {
      setLoading(false);
    }
  };

  const challenges = activeTab === 'all' ? allChallenges : myChallenges;

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl font-semibold md:text-4xl">
              Learning Challenges
            </h1>
            <p className="text-muted-foreground">
              Join challenges, compete with friends, and earn rewards!
            </p>
          </div>
          {firebaseUser && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="my">My Challenges</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ChallengeSkeleton />
                <ChallengeSkeleton />
                <ChallengeSkeleton />
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No challenges yet</p>
                <p>Be the first to create a learning challenge!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge as any}
                    onJoin={() => loadChallenges()}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="my">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ChallengeSkeleton />
                <ChallengeSkeleton />
                <ChallengeSkeleton />
              </div>
            ) : myChallenges.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">You haven't joined any challenges yet</p>
                <p>Join a challenge to start competing and earning rewards!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge as any}
                    onJoin={() => loadChallenges()}
                    showProgress
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {firebaseUser && (
        <CreateChallengeDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) loadChallenges();
          }}
        />
      )}
    </>
  );
}

