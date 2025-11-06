'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Trophy, BrainCircuit, Target, BookOpen } from 'lucide-react';
import { awardDailySessionPointsAction } from './actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { MathQuizGame } from '@/components/games/math-quiz-game';
import { FocusTapsGame } from '@/components/games/focus-taps-game';

const DAILY_SESSION_GAMES = [
    { id: 'math-quiz', title: 'Math Quiz', description: 'Quick-fire math problems.', icon: <BrainCircuit />, component: MathQuizGame },
    { id: 'focus-taps', title: 'Focus Taps', description: 'Test your reaction speed.', icon: <Target />, component: FocusTapsGame },
    { id: 'vocab-challenge', title: 'Vocab Challenge', description: 'Expand your vocabulary.', icon: <BookOpen />, component: MathQuizGame }, // Placeholder
];

export function DailySession() {
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const { firebaseUser } = useAuth();
  const { toast } = useToast();

  const progress = (completedGames.length / DAILY_SESSION_GAMES.length) * 100;

  const handleGameComplete = (gameId: string) => {
    setCompletedGames((prev) => [...new Set([...prev, gameId])]);
    setActiveGameId(null);
  };
  
  useEffect(() => {
    if (completedGames.length === DAILY_SESSION_GAMES.length && !sessionComplete) {
      const awardPoints = async () => {
        if (!firebaseUser) return;
        const idToken = await firebaseUser.getIdToken();
        const result = await awardDailySessionPointsAction(idToken);
        
        if (result.success) {
            toast({
                title: 'Daily Session Complete!',
                description: `You've earned bonus Knowledge Coins! New balance: ${result.newBalance}`,
            });
            setSessionComplete(true);
        } else {
             toast({
                variant: 'destructive',
                title: 'Could not award points',
                description: result.error,
            });
        }
      };
      awardPoints();
    }
  }, [completedGames, sessionComplete, firebaseUser, toast]);

  const activeGame = DAILY_SESSION_GAMES.find(g => g.id === activeGameId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Brain Session</CardTitle>
        <CardDescription>Complete these mini-games each day to earn a bonus reward!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sessionComplete ? (
          <div className="flex flex-col items-center gap-4 text-center text-primary p-8 rounded-lg bg-secondary">
            <Trophy className="h-16 w-16" />
            <h3 className="text-2xl font-bold">Daily Session Complete!</h3>
            <p className="text-muted-foreground">Come back tomorrow for another session.</p>
          </div>
        ) : (
          <>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-sm font-medium">Session Progress</p>
                <p className="text-sm text-muted-foreground">{completedGames.length} of {DAILY_SESSION_GAMES.length} complete</p>
              </div>
              <Progress value={progress} />
            </div>
            <div className="space-y-3">
              {DAILY_SESSION_GAMES.map((game) => {
                const isCompleted = completedGames.includes(game.id);
                return (
                  <Button 
                    key={game.id}
                    variant="secondary" 
                    className="w-full justify-start h-auto py-3" 
                    disabled={isCompleted}
                    onClick={() => setActiveGameId(game.id)}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div className="text-primary">{game.icon}</div>
                      <div className="text-left">
                        <p className="font-semibold">{game.title}</p>
                        <p className="text-xs text-muted-foreground">{game.description}</p>
                      </div>
                      {isCompleted && <CheckCircle className="ml-auto h-5 w-5 text-green-500" />}
                    </div>
                  </Button>
                );
              })}
            </div>
          </>
        )}
         <Sheet open={!!activeGame} onOpenChange={(open) => !open && setActiveGameId(null)}>
            <SheetContent className="overflow-y-auto">
              {activeGame && (
                <>
                    <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
                        <SheetTitle>{activeGame.title}</SheetTitle>
                    </SheetHeader>
                    <div className="min-h-[calc(100vh-12rem)] pt-4 overflow-y-auto">
                        <activeGame.component onComplete={() => handleGameComplete(activeGame.id)} />
                    </div>
                </>
              )}
            </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}
