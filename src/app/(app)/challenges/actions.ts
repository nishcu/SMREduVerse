'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { LearningChallenge } from '@/lib/types';

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

    // Check if user is participant
    if (!challenge.participants.includes(uid)) {
      return {
        success: false,
        error: 'You are not part of this challenge.',
      };
    }

    // Update progress
    const participantDetails = {
      ...challenge.participantDetails,
      [uid]: {
        ...challenge.participantDetails[uid],
        progress: Math.max(0, Math.min(100, progress)),
      },
    };

    // Recalculate leaderboard
    const leaderboard = Object.entries(participantDetails)
      .map(([uidKey, details]: [string, any]) => ({
        uid: uidKey,
        name: details.name,
        avatarUrl: details.avatarUrl,
        progress: details.progress,
        rank: 0, // Will be set below
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

    // Create notification for top 3 participants when leaderboard changes
    if (leaderboard.length > 0 && leaderboard[0].uid === uid) {
      // Notify other top participants
      const topParticipants = leaderboard.slice(0, 3).filter(p => p.uid !== uid && p.uid !== challenge.creator.uid);
      for (const participant of topParticipants) {
        const notificationRef = db.collection(`users/${participant.uid}/notifications`).doc();
        await notificationRef.set({
          type: 'challenge_progress',
          actor: {
            uid,
            name: challenge.participantDetails[uid].name,
            avatarUrl: challenge.participantDetails[uid].avatarUrl,
          },
          data: {
            challengeId,
          },
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    revalidatePath('/challenges');
    return {
      success: true,
      leaderboard,
    };
  } catch (error: any) {
    console.error('Error updating challenge progress:', error);
    return {
      success: false,
      error: error.message || 'Failed to update progress.',
    };
  }
}

export async function getChallengesAction(idToken?: string, limit: number = 20) {
  const db = getAdminDb();
  const auth = idToken ? getAdminAuth() : null;

  try {
    let uid: string | undefined;
    if (idToken && auth) {
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (e) {
        // Invalid token, continue without user context
      }
    }

    // Get active challenges
    const challengesSnapshot = await db
      .collection('challenges')
      .where('status', 'in', ['upcoming', 'active'])
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const challenges = challengesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
        endDate: data.endDate?.toDate ? data.endDate.toDate().toISOString() : data.endDate,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        isJoined: uid ? data.participants?.includes(uid) : false,
      };
    });

    return {
      success: true,
      challenges,
    };
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return {
      success: false,
      error: error.message || 'Failed to load challenges.',
      challenges: [],
    };
  }
}

export async function getUserChallengesAction(idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get challenges where user is participant
    const challengesSnapshot = await db
      .collection('challenges')
      .where('participants', 'array-contains', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const challenges = challengesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
        endDate: data.endDate?.toDate ? data.endDate.toDate().toISOString() : data.endDate,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        userProgress: data.participantDetails?.[uid]?.progress || 0,
      };
    });

    return {
      success: true,
      challenges,
    };
  } catch (error: any) {
    console.error('Error fetching user challenges:', error);
    return {
      success: false,
      error: error.message || 'Failed to load your challenges.',
      challenges: [],
    };
  }
}

