'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { LearningChallenge } from '@/lib/types';
import { deductCoins, awardCoins } from '@/lib/coin-transactions';
import { getEconomySettingsAction as getSettings } from '@/app/super-admin/settings/actions';
import { logActivity } from '@/lib/activity-logger';

const CreateChallengeSchema = z.object({
  idToken: z.string(),
  title: z.string().min(1, 'Title is required.').max(100, 'Title must be 100 characters or less.'),
  description: z.string().min(1, 'Description is required.').max(500, 'Description must be 500 characters or less.'),
  type: z.enum(['course_completion', 'subject_mastery', 'daily_goal', 'time_based', 'custom']),
  target: z.object({
    courseId: z.string().optional(),
    subject: z.string().optional(),
    goal: z.string().optional(),
    duration: z.number().optional(),
  }),
  startDate: z.string(), // ISO string
  endDate: z.string().optional(), // ISO string
  rewards: z.object({
    coins: z.number().min(0),
    points: z.number().min(0),
    badge: z.string().optional(),
  }),
});

const UpdateProgressSchema = z.object({
  idToken: z.string(),
  challengeId: z.string(),
  progress: z.number().min(0).max(100),
});

export async function createChallengeAction(formData: FormData) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const idToken = formData.get('idToken') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const targetCourseId = formData.get('target.courseId') as string || '';
    const targetSubject = formData.get('target.subject') as string || '';
    const targetGoal = formData.get('target.goal') as string || '';
    const targetDuration = formData.get('target.duration') as string || '';
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string || '';
    const rewardsCoins = formData.get('rewards.coins') as string || '0';
    const rewardsPoints = formData.get('rewards.points') as string || '0';
    const rewardsBadge = formData.get('rewards.badge') as string || '';

    const validatedFields = CreateChallengeSchema.safeParse({
      idToken,
      title,
      description,
      type,
      target: {
        courseId: targetCourseId || undefined,
        subject: targetSubject || undefined,
        goal: targetGoal || undefined,
        duration: targetDuration ? parseInt(targetDuration) : undefined,
      },
      startDate,
      endDate: endDate || undefined,
      rewards: {
        coins: parseInt(rewardsCoins),
        points: parseInt(rewardsPoints),
        badge: rewardsBadge || undefined,
      },
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data.',
      };
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user profile
    const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
    const userProfileSnap = await userProfileRef.get();
    
    if (!userProfileSnap.exists) {
      return {
        success: false,
        error: 'User profile not found.',
      };
    }

    const userProfile = userProfileSnap.data()!;

    // Get economy settings to check host fee
    const economySettings = await getSettings();
    if (!economySettings) {
      return {
        success: false,
        error: 'Economy settings not found. Please contact support.',
      };
    }

    // Deduct host fee
    const hostFee = economySettings.costToHostChallenge || 0;
    if (hostFee > 0) {
      const balanceCheck = await deductCoins(
        uid,
        hostFee,
        `Hosted Challenge: ${validatedFields.data.title}`,
        {
          activityType: 'challenge',
          activityTitle: validatedFields.data.title,
        }
      );

      if (!balanceCheck.success) {
        return {
          success: false,
          error: balanceCheck.error || 'Insufficient coins to host challenge.',
        };
      }
    }

    // Create challenge
    const challengeData = {
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      creator: {
        uid,
        name: userProfile.name || 'Anonymous',
        avatarUrl: userProfile.avatarUrl || '',
      },
      type: validatedFields.data.type,
      target: validatedFields.data.target,
      participants: [uid], // Creator joins automatically
      participantDetails: {
        [uid]: {
          name: userProfile.name || 'Anonymous',
          avatarUrl: userProfile.avatarUrl || '',
          progress: 0,
          joinedAt: FieldValue.serverTimestamp(),
        },
      },
      status: new Date(startDate) > new Date() ? 'upcoming' : 'active',
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: endDate ? Timestamp.fromDate(new Date(endDate)) : null,
      rewards: validatedFields.data.rewards,
      leaderboard: [],
      prizePool: 0, // Initialize prize pool
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const challengeRef = await db.collection('challenges').add(challengeData);

    revalidatePath('/challenges');
    return {
      success: true,
      challengeId: challengeRef.id,
    };
  } catch (error: any) {
    console.error('Error creating challenge:', error);
    return {
      success: false,
      error: error.message || 'Failed to create challenge.',
    };
  }
}

export async function joinChallengeAction(challengeId: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch challenge
    const challengeRef = db.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      return {
        success: false,
        error: 'Challenge not found.',
      };
    }

    const challenge = challengeSnap.data() as any;

    // Check if already joined
    if (challenge.participants.includes(uid)) {
      return {
        success: false,
        error: 'You are already part of this challenge.',
      };
    }

    // Fetch user profile
    const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
    const userProfileSnap = await userProfileRef.get();
    
    if (!userProfileSnap.exists) {
      return {
        success: false,
        error: 'User profile not found.',
      };
    }

    const userProfile = userProfileSnap.data()!;

    // Get economy settings to check join fee
    const economySettings = await getSettings();
    if (!economySettings) {
      return {
        success: false,
        error: 'Economy settings not found. Please contact support.',
      };
    }

    // Deduct join fee from participant
    const joinFee = economySettings.costToJoinChallenge || 0;
    if (joinFee > 0) {
      const balanceCheck = await deductCoins(
        uid,
        joinFee,
        `Joined Challenge: ${challenge.title}`,
        {
          activityId: challengeId,
          activityType: 'challenge',
          activityTitle: challenge.title,
        }
      );

      if (!balanceCheck.success) {
        return {
          success: false,
          error: balanceCheck.error || 'Insufficient coins to join challenge.',
        };
      }

      // Log activity
      await logActivity(
        uid,
        'challenge_join',
        `Joined Challenge: ${challenge.title}`,
        `Paid ${joinFee} coins to join challenge`,
        { amount: joinFee, challengeId, challengeTitle: challenge.title }
      );
    }

    // Calculate prize pool contribution and host earnings
    const participantFeePercent = economySettings.participantFeePercent || 0;
    const hostEarning = joinFee > 0 ? Math.floor(joinFee * participantFeePercent / 100) : 0;
    const prizePoolContribution = joinFee - hostEarning;

    // Award coins to host if applicable
    if (hostEarning > 0 && challenge.creator.uid !== uid) {
      await awardCoins(
        challenge.creator.uid,
        hostEarning,
        `Host earnings from: ${challenge.title}`,
        {
          activityId: challengeId,
          activityType: 'challenge',
          activityTitle: challenge.title,
          recipientId: uid,
          recipientName: userProfile.name || 'Anonymous',
        }
      );
    }

    // Update challenge prize pool (store in challenge document)
    const currentPrizePool = challenge.prizePool || 0;
    const newPrizePool = currentPrizePool + prizePoolContribution;

    // Add participant
    const participants = [...challenge.participants, uid];
    const participantDetails = {
      ...challenge.participantDetails,
      [uid]: {
        name: userProfile.name || 'Anonymous',
        avatarUrl: userProfile.avatarUrl || '',
        progress: 0,
        joinedAt: FieldValue.serverTimestamp(),
      },
    };

    await challengeRef.update({
      participants,
      participantDetails,
      prizePool: newPrizePool,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create notification for challenge creator
    if (challenge.creator.uid !== uid) {
      const notificationRef = db.collection(`users/${challenge.creator.uid}/notifications`).doc();
      await notificationRef.set({
        type: 'challenge_invite',
        actor: {
          uid,
          name: userProfile.name || 'Anonymous',
          avatarUrl: userProfile.avatarUrl || '',
        },
        data: {
          challengeId,
        },
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    revalidatePath('/challenges');
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error joining challenge:', error);
    return {
      success: false,
      error: error.message || 'Failed to join challenge.',
    };
  }
}

export async function updateChallengeProgressAction(challengeId: string, progress: number, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const validatedFields = UpdateProgressSchema.safeParse({
      idToken,
      challengeId,
      progress,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid data.',
      };
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch challenge
    const challengeRef = db.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      return {
        success: false,
        error: 'Challenge not found.',
      };
    }

    const challenge = challengeSnap.data() as any;

    // Check if user is a participant
    if (!challenge.participants.includes(uid)) {
      return {
        success: false,
        error: 'You are not part of this challenge.',
      };
    }

    // Update participant progress
    const participantDetails = {
      ...challenge.participantDetails,
      [uid]: {
        ...challenge.participantDetails[uid],
        progress: Math.min(100, Math.max(0, progress)),
      },
    };

    // Update leaderboard
    const leaderboard = Object.entries(participantDetails)
      .map(([uid, details]: [string, any]) => ({
        uid,
        name: details.name,
        avatarUrl: details.avatarUrl,
        progress: details.progress,
      }))
      .sort((a, b) => b.progress - a.progress)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    await challengeRef.update({
      participantDetails,
      leaderboard,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Check if challenge should be completed
    const endDate = challenge.endDate ? challenge.endDate.toDate() : null;
    const shouldComplete = endDate && endDate <= new Date() && challenge.status !== 'completed';

    if (shouldComplete) {
      await completeChallengeAction(challengeId);
    }

    revalidatePath('/challenges');
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error updating challenge progress:', error);
    return {
      success: false,
      error: error.message || 'Failed to update progress.',
    };
  }
}

export async function completeChallengeAction(challengeId: string) {
  const db = getAdminDb();

  try {
    const challengeRef = db.collection('challenges').doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      return {
        success: false,
        error: 'Challenge not found.',
      };
    }

    const challenge = challengeSnap.data() as any;

    if (challenge.status === 'completed') {
      return {
        success: false,
        error: 'Challenge already completed.',
      };
    }

    // Get economy settings
    const economySettings = await getSettings();
    if (!economySettings) {
      return {
        success: false,
        error: 'Economy settings not found.',
      };
    }

    // Get sorted leaderboard (top 3)
    const leaderboard = challenge.leaderboard || [];
    const topThree = leaderboard.slice(0, 3);

    const prizePool = challenge.prizePool || 0;

    // Distribute prize pool and base rewards
    if (topThree.length > 0 && prizePool > 0) {
      // Calculate prize distribution percentages
      const distribution = [
        { percent: 50, reward: economySettings.rewardForChallengeWin || 100 },    // 1st: 50% of pool + base reward
        { percent: 30, reward: economySettings.rewardForChallengeSecond || 50 }, // 2nd: 30% of pool + base reward
        { percent: 20, reward: economySettings.rewardForChallengeThird || 25 },  // 3rd: 20% of pool + base reward
      ];

      for (let i = 0; i < topThree.length; i++) {
        const winner = topThree[i];
        const dist = distribution[i];
        const prizeAmount = Math.floor(prizePool * dist.percent / 100);
        const totalReward = prizeAmount + dist.reward;

        await awardCoins(
          winner.uid,
          totalReward,
          `Challenge Winner: ${challenge.title} (${i + 1 === 1 ? '1st' : i + 1 === 2 ? '2nd' : '3rd'} Place)`,
          {
            activityId: challengeId,
            activityType: 'challenge',
            activityTitle: challenge.title,
          }
        );
      }
    }

    // Mark challenge as completed
    await challengeRef.update({
      status: 'completed',
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/challenges');
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error completing challenge:', error);
    return {
      success: false,
      error: error.message || 'Failed to complete challenge.',
    };
  }
}

export async function getChallengesAction(userId?: string) {
  const db = getAdminDb();

  try {
    let query = db.collection('challenges');
    
    if (userId) {
      query = query.where('participants', 'array-contains', userId);
    }

    const snapshot = await query.get();
    const challenges = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as LearningChallenge));

    // Sort by createdAt (newest first) - in memory to avoid index requirements
    challenges.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return {
      success: true,
      challenges,
    };
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch challenges.',
      challenges: [],
    };
  }
}

export async function getUserChallengesAction(userId: string) {
  const db = getAdminDb();

  try {
    const snapshot = await db.collection('challenges')
      .where('participants', 'array-contains', userId)
      .get();

    const challenges = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as LearningChallenge));

    // Sort by createdAt (newest first) - in memory
    challenges.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return {
      success: true,
      challenges,
    };
  } catch (error: any) {
    console.error('Error fetching user challenges:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user challenges.',
      challenges: [],
    };
  }
}
