
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const PostSchema = z
  .object({
    content: z.string().max(280, 'Post content cannot exceed 280 characters.'),
    imageUrl: z.string().url().optional().or(z.literal('')),
    postType: z.enum(['text', 'image', 'video', 'question']),
    subject: z.string().min(1, 'Please select a subject.'),
    idToken: z.string(),
  })
  .refine(
    (data) => {
      const hasContent = data.content?.trim().length > 0;
      const hasMedia = data.imageUrl && data.imageUrl.trim().length > 0;
      return hasContent || hasMedia;
    },
    {
      message: 'Please add text or upload an image/video.',
      path: ['content'],
    }
  );

export async function createPostAction(prevState: any, formData: FormData) {
  const auth = getAdminAuth();
  const db = getAdminDb();
  
  const validatedFields = PostSchema.safeParse({
    content: formData.get('content'),
    imageUrl: formData.get('imageUrl'),
    postType: formData.get('postType'),
    subject: formData.get('subject'),
    idToken: formData.get('idToken'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { idToken, ...postData } = validatedFields.data;
  let uid;
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    uid = decodedToken.uid;
    
    // Fetch the user's profile to get their name and avatar - use correct path
    const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
    const userProfileSnap = await userProfileRef.get();
    
    if (!userProfileSnap.exists) {
        throw new Error('User profile not found.');
    }
    const userProfile = userProfileSnap.data()!;

    const postPayload = {
      authorUid: uid,
      author: {
        uid: uid,
        name: userProfile.name || 'Anonymous',
        avatarUrl: userProfile.avatarUrl || '',
      },
      content: postData.content,
      imageUrl: postData.imageUrl,
      postType: postData.postType,
      subject: postData.subject,
      likes: 0,
      comments: 0,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection('posts').add(postPayload);

    revalidatePath('/social');
    return { success: true, error: null, errors: null };

  } catch (error: any) {
    console.error(`Error creating post for user ${uid}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to create post. Please try again.',
      errors: null,
    };
  }
}

const CommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(500),
  postId: z.string().min(1),
  idToken: z.string(),
});

export async function createCommentAction(postId: string, content: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  const validatedFields = CommentSchema.safeParse({
    content,
    postId,
    idToken,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Invalid comment data.',
    };
  }

  let uid;
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    uid = decodedToken.uid;

    // Fetch the user's profile - use the correct path: users/{uid}/profile/{uid}
    const userProfileRef = db.doc(`users/${uid}/profile/${uid}`);
    const userProfileSnap = await userProfileRef.get();
    
    let userProfile: any;
    
    if (!userProfileSnap.exists) {
      // Profile doesn't exist, create it with basic info from Firebase token
      userProfile = {
        name: decodedToken.name || 'Anonymous',
        username: decodedToken.email?.split('@')[0] || `user${uid.slice(0, 8)}`,
        email: decodedToken.email || '',
        avatarUrl: decodedToken.picture || '',
        bio: '',
        followersCount: 0,
        followingCount: 0,
        knowledgePoints: 0,
        wallet: { knowledgeCoins: 0 },
        settings: {
          restrictSpending: false,
          restrictChat: false,
          restrictTalentHub: false,
        },
        grade: 'Not specified',
        educationHistory: [],
        syllabus: 'Not specified',
        medium: 'Not specified',
        interests: [],
        sports: [],
        createdAt: FieldValue.serverTimestamp(),
      };
      
      await userProfileRef.set(userProfile);
    } else {
      userProfile = userProfileSnap.data()!;
    }

    // Create comment with profile info
    const commentPayload = {
      postId,
      authorUid: uid,
      author: {
        uid: uid,
        name: userProfile.name || 'Anonymous',
        avatarUrl: userProfile.avatarUrl || '',
      },
      content,
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.collection('comments').add(commentPayload);

    // Update post comment count
    const postRef = db.collection('posts').doc(postId);
    const postSnap = await postRef.get();
    const postData = postSnap.data();
    
    await postRef.update({
      comments: FieldValue.increment(1),
    });

    // Create notification for post author (if not commenting on own post)
    if (postData && postData.authorUid !== uid) {
      await createNotificationAction(postData.authorUid, {
        type: 'post_comment',
        actorUid: uid,
        postId: postId,
      }).catch(err => console.error('Error creating comment notification:', err));
    }

    revalidatePath('/social');
    return { success: true, error: null };

  } catch (error: any) {
    console.error(`Error creating comment for user ${uid}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to add comment. Please try again.',
    };
  }
}

export async function getCommentsAction(postId: string) {
  const db = getAdminDb();

  try {
    const commentsSnapshot = await db
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'asc')
      .get();

    const comments = commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, comments };

  } catch (error: any) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load comments.',
      comments: [],
    };
  }
}

// Like/Unlike Actions
export async function toggleLikeAction(postId: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const likeRef = db.doc(`posts/${postId}/likes/${uid}`);
    const likeSnap = await likeRef.get();
    const postRef = db.doc(`posts/${postId}`);

    if (likeSnap.exists) {
      // Unlike: Remove like document and decrement count
      await likeRef.delete();
      await postRef.update({
        likes: FieldValue.increment(-1),
      });
      return { success: true, liked: false };
    } else {
      // Like: Create like document and increment count
      await likeRef.set({
        userId: uid,
        createdAt: FieldValue.serverTimestamp(),
      });
      await postRef.update({
        likes: FieldValue.increment(1),
      });
      
      // Create notification for post author (if not liking own post)
      const postSnap = await postRef.get();
      const postData = postSnap.data();
      if (postData && postData.authorUid !== uid) {
        await createNotificationAction(postData.authorUid, {
          type: 'post_like',
          actorUid: uid,
          postId: postId,
        }).catch(err => console.error('Error creating like notification:', err));
      }
      
      return { success: true, liked: true };
    }
  } catch (error: any) {
    console.error(`Error toggling like for post ${postId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to toggle like.',
    };
  }
}

export async function checkLikedAction(postId: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const likeRef = db.doc(`posts/${postId}/likes/${uid}`);
    const likeSnap = await likeRef.get();

    return { success: true, liked: likeSnap.exists };
  } catch (error: any) {
    return { success: false, liked: false };
  }
}

export async function getLikedUsersAction(postId: string, limit: number = 5) {
  const db = getAdminDb();

  try {
    const likesSnapshot = await db
      .collection(`posts/${postId}/likes`)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const likedUserIds = likesSnapshot.docs.map((doc) => doc.id);

    // Fetch user profiles for liked users
    const userProfiles = await Promise.all(
      likedUserIds.map(async (userId) => {
        const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);
        const userProfileSnap = await userProfileRef.get();
        if (userProfileSnap.exists) {
          const data = userProfileSnap.data()!;
          return {
            uid: userId,
            name: data.name || 'Anonymous',
            avatarUrl: data.avatarUrl || '',
          };
        }
        return null;
      })
    );

    return {
      success: true,
      users: userProfiles.filter(Boolean),
    };
  } catch (error: any) {
    console.error(`Error fetching liked users for post ${postId}:`, error);
    return {
      success: false,
      users: [],
    };
  }
}

// Follow/Unfollow Actions
export async function toggleFollowAction(targetUserId: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    if (currentUserId === targetUserId) {
      return {
        success: false,
        error: 'You cannot follow yourself.',
      };
    }

    const followRef = db.doc(`users/${currentUserId}/following/${targetUserId}`);
    const followerRef = db.doc(`users/${targetUserId}/followers/${currentUserId}`);
    const followSnap = await followRef.get();

    const currentUserProfileRef = db.doc(`users/${currentUserId}/profile/${currentUserId}`);
    const targetUserProfileRef = db.doc(`users/${targetUserId}/profile/${targetUserId}`);

    if (followSnap.exists) {
      // Unfollow: Remove follow relationship
      await followRef.delete();
      await followerRef.delete();
      
      // Decrement counts
      await currentUserProfileRef.update({
        followingCount: FieldValue.increment(-1),
      });
      await targetUserProfileRef.update({
        followersCount: FieldValue.increment(-1),
      });

      return { success: true, following: false };
    } else {
      // Follow: Create follow relationship
      await followRef.set({
        userId: targetUserId,
        createdAt: FieldValue.serverTimestamp(),
      });
      await followerRef.set({
        userId: currentUserId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Increment counts
      await currentUserProfileRef.update({
        followingCount: FieldValue.increment(1),
      });
      await targetUserProfileRef.update({
        followersCount: FieldValue.increment(1),
      });

      // Create notification for the user being followed
      await createNotificationAction(targetUserId, {
        type: 'new_follower',
        actorUid: currentUserId,
      }).catch(err => console.error('Error creating follow notification:', err));

      return { success: true, following: true };
    }
  } catch (error: any) {
    console.error(`Error toggling follow for user ${targetUserId}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to toggle follow.',
    };
  }
}

export async function checkFollowingAction(targetUserId: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    const followRef = db.doc(`users/${currentUserId}/following/${targetUserId}`);
    const followSnap = await followRef.get();

    return { success: true, following: followSnap.exists };
  } catch (error: any) {
    return { success: false, following: false };
  }
}

// Get Following Feed
export async function getFollowingFeedAction(idToken: string, limit: number = 20) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const currentUserId = decodedToken.uid;

    // Get list of users being followed
    const followingSnapshot = await db
      .collection(`users/${currentUserId}/following`)
      .get();

    const followingUserIds = followingSnapshot.docs.map((doc) => doc.id);

    if (followingUserIds.length === 0) {
      return { success: true, posts: [] };
    }

    // Get posts from followed users
    // Note: Using where().orderBy() requires an index, so we fetch without orderBy and sort in memory
    const postsSnapshot = await db
      .collection('posts')
      .where('authorUid', 'in', followingUserIds.slice(0, 10)) // Firestore 'in' limit is 10
      .get();

    // If more than 10 users, query in batches
    let posts = postsSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to serializable format
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
      return {
        id: doc.id,
        ...data,
        createdAt: createdAt,
      };
    });

    if (followingUserIds.length > 10) {
      const remainingUserIds = followingUserIds.slice(10);
      for (let i = 0; i < remainingUserIds.length; i += 10) {
        const batch = remainingUserIds.slice(i, i + 10);
        const batchSnapshot = await db
          .collection('posts')
          .where('authorUid', 'in', batch)
          .get();
        
        const batchPosts = batchSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to serializable format
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
          return {
            id: doc.id,
            ...data,
            createdAt: createdAt,
          };
        });
        posts = [...posts, ...batchPosts];
      }
    }
    
    // Sort by createdAt in memory (descending - newest first) and limit
    posts = posts
      .sort((a, b) => {
        // Handle both ISO string and Timestamp formats
        const aTime = typeof a.createdAt === 'string' 
          ? new Date(a.createdAt).getTime() 
          : a.createdAt?.toMillis?.() || 0;
        const bTime = typeof b.createdAt === 'string'
          ? new Date(b.createdAt).getTime()
          : b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    return { success: true, posts };
  } catch (error: any) {
    console.error(`Error fetching following feed:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load following feed.',
      posts: [],
    };
  }
}

// Get Trending Feed (posts with most engagement)
export async function getTrendingFeedAction(limit: number = 20) {
  const db = getAdminDb();

  try {
    // Get all posts (or a larger sample) to calculate engagement score
    // Fetch more posts to ensure we have enough to calculate trending
    const postsSnapshot = await db
      .collection('posts')
      .get();

    // Calculate engagement score for each post
    // Engagement = (likes * 1) + (comments * 2) + (recent boost if within 24 hours)
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const posts = postsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        const likes = data.likes || 0;
        const comments = data.comments || 0;
        
        // Calculate time-based boost (posts from last 24 hours get boost)
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : 
                          (typeof data.createdAt === 'string' ? new Date(data.createdAt).getTime() : now);
        const isRecent = createdAt > oneDayAgo;
        const timeBoost = isRecent ? 5 : 0; // Boost recent posts
        
        // Engagement score: likes + (comments * 2) + time boost
        const engagement = likes + (comments * 2) + timeBoost;
        
        // Convert Firestore Timestamp to serializable format
        const createdAtISO = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : 
                            (typeof data.createdAt === 'string' ? data.createdAt : new Date(createdAt).toISOString());
        
        return {
          id: doc.id,
          ...data,
          createdAt: createdAtISO,
          engagement,
        };
      })
      .sort((a, b) => {
        // Primary sort: engagement score (descending)
        if (b.engagement !== a.engagement) {
          return b.engagement - a.engagement;
        }
        // Secondary sort: most recent (descending) if engagement is equal
        const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
        const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    return { success: true, posts };
  } catch (error: any) {
    console.error(`Error fetching trending feed:`, error);
    return {
      success: false,
      error: error.message || 'Failed to load trending feed.',
      posts: [],
    };
  }
}

// Notification System
interface CreateNotificationParams {
  type: 'post_like' | 'post_comment' | 'new_follower';
  actorUid: string;
  postId?: string;
}

async function createNotificationAction(targetUserId: string, params: CreateNotificationParams) {
  const db = getAdminDb();
  
  try {
    // Get actor profile
    const actorProfileRef = db.doc(`users/${params.actorUid}/profile/${params.actorUid}`);
    const actorProfileSnap = await actorProfileRef.get();
    
    if (!actorProfileSnap.exists) {
      console.error('Actor profile not found for notification');
      return { success: false };
    }
    
    const actorProfile = actorProfileSnap.data()!;
    
    // Create notification
    const notificationRef = db.collection(`users/${targetUserId}/notifications`).doc();
    await notificationRef.set({
      type: params.type,
      actor: {
        uid: params.actorUid,
        name: actorProfile.name || 'Anonymous',
        avatarUrl: actorProfile.avatarUrl || '',
      },
      data: params.postId ? { postId: params.postId } : undefined,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

// Get Notifications
export async function getNotificationsAction(idToken: string, limit: number = 50) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const notificationsSnapshot = await db
      .collection(`users/${uid}/notifications`)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const notifications = notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, notifications };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      error: error.message || 'Failed to load notifications.',
      notifications: [],
    };
  }
}

// Mark Notification as Read
export async function markNotificationReadAction(notificationId: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const notificationRef = db.doc(`users/${uid}/notifications/${notificationId}`);
    await notificationRef.update({
      read: true,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark notification as read.',
    };
  }
}

// Mark All Notifications as Read
export async function markAllNotificationsReadAction(idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const notificationsSnapshot = await db
      .collection(`users/${uid}/notifications`)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    notificationsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark all notifications as read.',
    };
  }
}