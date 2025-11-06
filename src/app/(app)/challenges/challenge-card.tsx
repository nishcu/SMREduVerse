'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { joinChallengeAction, updateChallengeProgressAction } from './actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Users, Target, Calendar, Award, TrendingUp, LogIn, Coins } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import type { LearningChallenge } from '@/lib/types';

interface ChallengeCardProps {
  challenge: LearningChallenge & {
    createdAt?: string;
    startDate?: string;
    endDate?: string;
    isJoined?: boolean;
    userProgress?: number;
  };
  onJoin?: () => void;
  showProgress?: boolean;
}

export function ChallengeCard({ challenge, onJoin, showProgress }: ChallengeCardProps) {
  const { user, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(challenge.isJoined || false);
  const [progress, setProgress] = useState(challenge.userProgress || 0);
  const [participants, setParticipants] = useState(challenge.participants?.length || 0);
  const [joinCost, setJoinCost] = useState<number | null>(null);
  
  useEffect(() => {
    fetch('/api/economy-settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setJoinCost(data.costToJoinChallenge || 0);
        }
      })
      .catch(err => {
        console.error('Error fetching economy settings:', err);
      });
  }, []);

  const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
  const endDate = challenge.endDate ? new Date(challenge.endDate) : null;
  const isActive = challenge.status === 'active';
  const isUpcoming = challenge.status === 'upcoming';

  const handleJoin = async () => {
    if (!firebaseUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please sign in to join challenges.',
      });
      return;
    }

    setIsJoining(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await joinChallengeAction(challenge.id, idToken);
      
      if (result.success) {
        setIsJoined(true);
        setParticipants(prev => prev + 1);
        toast({
          title: 'Success',
          description: 'You joined the challenge!',
        });
        onJoin?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to join challenge.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to join challenge.',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleUpdateProgress = async (newProgress: number) => {
    if (!firebaseUser || !isJoined) return;

    try {
      const idToken = await firebaseUser.getIdToken();
      const result = await updateChallengeProgressAction(challenge.id, newProgress, idToken);
      
      if (result.success) {
        setProgress(newProgress);
        toast({
          title: 'Progress Updated',
          description: 'Your challenge progress has been updated.',
        });
        onJoin?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to update progress.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update progress.',
      });
    }
  };

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{challenge.title}</CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {challenge.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{challenge.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{participants} participants</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span>{challenge.rewards.coins} coins</span>
          </div>
          {!isJoined && joinCost !== null && joinCost > 0 && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Coins className="h-4 w-4" />
              <span>Entry: {joinCost} coins</span>
            </div>
          )}
          {challenge.prizePool !== undefined && challenge.prizePool > 0 && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Trophy className="h-4 w-4" />
              <span>Prize Pool: {challenge.prizePool} coins</span>
            </div>
          )}
        </div>

        {showProgress && isJoined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Your Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateProgress(Math.min(100, progress + 10))}
                disabled={progress >= 100}
              >
                +10%
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateProgress(100)}
                disabled={progress >= 100}
              >
                Complete
              </Button>
            </div>
          </div>
        )}

        {challenge.leaderboard && challenge.leaderboard.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              Top Participants
            </div>
            <div className="space-y-1">
              {challenge.leaderboard.slice(0, 3).map((entry, index) => (
                <div key={entry.uid} className="flex items-center gap-2 text-sm">
                  <span className="font-bold w-6">#{entry.rank}</span>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={entry.avatarUrl} />
                    <AvatarFallback className="text-xs">{getInitials(entry.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{entry.name}</span>
                  <span className="text-muted-foreground">{entry.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3" />
            <span>Starts: {formatDistanceToNow(startDate, { addSuffix: true })}</span>
          </div>
          {endDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Ends: {formatDistanceToNow(endDate, { addSuffix: true })}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isJoined ? (
          <Button asChild className="w-full" variant="outline">
            <Link href={`/challenges/${challenge.id}`}>
              View Challenge <TrendingUp className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={isJoining || !isActive}
          >
            {isJoining ? (
              <>Joining...</>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Join Challenge {joinCost !== null && joinCost > 0 && `(${joinCost} coins)`}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

