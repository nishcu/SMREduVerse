'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import type { LearningRecommendation } from '@/lib/types';

export async function getPersonalizedFeedAction(idToken: string, limit: number = 20) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user profile
    const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
    const userProfileSnap = await userProfileRef.get();
    
    if (!userProfileSnap.exists) {
      return {
        success: false,
        error: 'User profile not found.',
        recommendations: [],
      };
    }

    const userProfile = userProfileSnap.data()!;

    // Get user interests and subjects
    const userInterests = userProfile.interests || [];
    const userSubjects = [userProfile.subject || userProfile.grade || 'General'];

    // Get user's enrolled courses
    const enrollmentsSnapshot = await db.collection(`users/${uid}/enrollments`).get();
    const enrolledCourseIds = enrollmentsSnapshot.docs.map(doc => doc.id);

    // Get user's following list
    const followingSnapshot = await db.collection(`users/${uid}/following`).get();
    const followingUserIds = followingSnapshot.docs.map(doc => doc.id);

    const recommendations: LearningRecommendation[] = [];

    // 1. Course Recommendations
    // Recommend courses matching user interests/subjects
    const coursesSnapshot = await db.collection('courses')
      .where('subject', 'in', userSubjects.length > 0 ? userSubjects.slice(0, 10) : ['General'])
      .limit(10)
      .get();

    coursesSnapshot.docs.forEach((doc) => {
      const course = doc.data();
      if (!enrolledCourseIds.includes(doc.id)) {
        let score = 50; // Base score

        // Boost score if matches user interests
        if (userInterests.length > 0 && course.subject) {
          const matchesInterest = userInterests.some(interest => 
            course.subject.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(course.subject.toLowerCase())
          );
          if (matchesInterest) score += 20;
        }

        // Boost score if popular (high enrollment)
        if (course.enrollmentCount > 100) score += 10;
        if (course.enrollmentCount > 1000) score += 10;

        // Boost score if created recently
        const createdAt = course.createdAt?.toDate ? course.createdAt.toDate() : new Date();
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 30) score += 10;

        recommendations.push({
          courseId: doc.id,
          type: 'course',
          reason: `Recommended based on your interest in ${course.subject}`,
          score: Math.min(100, score),
          socialSignals: {
            friendsLearning: 0, // Could be calculated from following list
            trending: course.enrollmentCount > 500,
          },
        });
      }
    });

    // 2. Study Buddy Recommendations
    // Find users with similar interests/subjects
    if (followingUserIds.length < 10) {
      const usersSnapshot = await db.collectionGroup('profile')
        .where('interests', 'array-contains-any', userInterests.length > 0 ? userInterests.slice(0, 10) : [])
        .limit(20)
        .get();

      usersSnapshot.docs.forEach((doc) => {
        const user = doc.data();
        const userId = doc.ref.path.split('/')[1]; // Extract user ID from path

        if (userId !== uid && !followingUserIds.includes(userId)) {
          let score = 40;

          // Boost score if user has similar interests
          const commonInterests = (user.interests || []).filter((interest: string) =>
            userInterests.includes(interest)
          );
          score += commonInterests.length * 10;

          // Boost score if user is active (has posts, enrollments, etc.)
          const userPostsSnapshot = db.collection('posts')
            .where('authorUid', '==', userId)
            .limit(1)
            .get();
          // This would need to be awaited, but for now we'll use a simpler approach

          recommendations.push({
            userId,
            type: 'study_buddy',
            reason: `Similar interests: ${commonInterests.join(', ') || 'Learning together'}`,
            score: Math.min(100, score),
          });
        }
      });
    }

    // 3. Content Recommendations (from posts)
    // Get posts from followed users or trending posts
    const postsSnapshot = followingUserIds.length > 0
      ? await db.collection('posts')
          .where('authorUid', 'in', followingUserIds.slice(0, 10))
          .limit(10)
          .get()
      : await db.collection('posts')
          .orderBy('likes', 'desc')
          .limit(10)
          .get();

    postsSnapshot.docs.forEach((doc) => {
      const post = doc.data();
      let score = 30;

      // Boost score if post has high engagement
      const engagement = (post.likes || 0) + (post.comments || 0) * 2;
      score += Math.min(30, engagement / 10);

      // Boost score if post matches user interests
      if (post.subject && userInterests.some(interest => 
        post.subject.toLowerCase().includes(interest.toLowerCase())
      )) {
        score += 20;
      }

      recommendations.push({
        postId: doc.id,
        type: 'content',
        reason: `Engaging post about ${post.subject || 'learning'}`,
        score: Math.min(100, score),
        socialSignals: {
          friendsLearning: followingUserIds.includes(post.authorUid) ? 1 : 0,
          trending: engagement > 50,
        },
      });
    }

    // Sort recommendations by score (highest first) and limit
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations.slice(0, limit);

    return {
      success: true,
      recommendations: topRecommendations,
    };
  } catch (error: any) {
    console.error('Error fetching personalized feed:', error);
    return {
      success: false,
      error: error.message || 'Failed to load personalized feed.',
      recommendations: [],
    };
  }
}

