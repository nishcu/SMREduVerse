'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BookOpen, Users, TrendingUp, MessageSquare, Target, ArrowRight } from 'lucide-react';
import { getPersonalizedFeedAction } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import type { LearningRecommendation } from '@/lib/types';

function RecommendationSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

export default function AILearningPage() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (firebaseUser) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [firebaseUser, activeTab]);

  const loadRecommendations = async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      const idToken = await firebaseUser.getIdToken();
      const result = await getPersonalizedFeedAction(idToken, 20);
      
      if (result.success) {
        setRecommendations(result.recommendations);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to load recommendations.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load recommendations.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = activeTab === 'all'
    ? recommendations
    : recommendations.filter(r => r.type === (activeTab === 'courses' ? 'course' : activeTab === 'buddies' ? 'study_buddy' : 'content'));

  const courses = filteredRecommendations.filter(r => r.type === 'course');
  const buddies = filteredRecommendations.filter(r => r.type === 'study_buddy');
  const content = filteredRecommendations.filter(r => r.type === 'content');

  if (!firebaseUser) {
    return (
      <div className="text-center text-muted-foreground py-16">
        <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-semibold">Sign in to see personalized recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-semibold md:text-4xl flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI-Powered Learning Feed
        </h1>
        <p className="text-muted-foreground">
          Personalized recommendations based on your interests, learning history, and social connections.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
          <TabsTrigger value="buddies">Study Buddies ({buddies.length})</TabsTrigger>
          <TabsTrigger value="content">Content ({content.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {loading ? (
            <div className="space-y-4">
              <RecommendationSkeleton />
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No recommendations yet</p>
              <p>Complete your profile and start learning to get personalized recommendations!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="courses">
          {loading ? (
            <div className="space-y-4">
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No course recommendations yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="buddies">
          {loading ? (
            <div className="space-y-4">
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </div>
          ) : buddies.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No study buddy recommendations yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buddies.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="content">
          {loading ? (
            <div className="space-y-4">
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </div>
          ) : content.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No content recommendations yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((rec, index) => (
                <RecommendationCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: LearningRecommendation }) {
  const getIcon = () => {
    switch (recommendation.type) {
      case 'course':
        return BookOpen;
      case 'study_buddy':
        return Users;
      case 'content':
        return MessageSquare;
      default:
        return TrendingUp;
    }
  };

  const Icon = getIcon();
  const scoreColor = recommendation.score >= 80 ? 'text-green-500' : recommendation.score >= 60 ? 'text-yellow-500' : 'text-gray-500';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {recommendation.type === 'course' && recommendation.courseId && (
                  <Link href={`/courses/${recommendation.courseId}`} className="hover:underline">
                    View Course
                  </Link>
                )}
                {recommendation.type === 'study_buddy' && recommendation.userId && (
                  <Link href={`/profile/${recommendation.userId}`} className="hover:underline">
                    View Profile
                  </Link>
                )}
                {recommendation.type === 'content' && recommendation.postId && (
                  <Link href={`/social#post-${recommendation.postId}`} className="hover:underline">
                    View Post
                  </Link>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{recommendation.reason}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={scoreColor}>
              {recommendation.score}% match
            </Badge>
            {recommendation.socialSignals?.trending && (
              <Badge variant="default">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
            {recommendation.socialSignals?.friendsLearning && recommendation.socialSignals.friendsLearning > 0 && (
              <Badge variant="secondary">
                {recommendation.socialSignals.friendsLearning} friend{recommendation.socialSignals.friendsLearning > 1 ? 's' : ''} learning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          {recommendation.type === 'course' && recommendation.courseId && (
            <Link href={`/courses/${recommendation.courseId}`}>
              Explore Course <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
          {recommendation.type === 'study_buddy' && recommendation.userId && (
            <Link href={`/profile/${recommendation.userId}`}>
              View Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
          {recommendation.type === 'content' && recommendation.postId && (
            <Link href={`/social#post-${recommendation.postId}`}>
              View Post <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

