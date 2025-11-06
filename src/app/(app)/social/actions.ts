
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const PostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.').max(280),
  imageUrl: z.string().url().optional().or(z.literal('')),
  postType: z.enum(['text', 'image', 'video', 'question']),
  subject: z.string().min(1, 'Please select a subject.'),
  idToken: z.string(),
});

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
    const postsSnapshot = await db
      .collection('posts')
      .where('authorUid', 'in', followingUserIds.slice(0, 10)) // Firestore 'in' limit is 10
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // If more than 10 users, query in batches
    let posts = postsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (followingUserIds.length > 10) {
      const remainingUserIds = followingUserIds.slice(10);
      for (let i = 0; i < remainingUserIds.length; i += 10) {
        const batch = remainingUserIds.slice(i, i + 10);
        const batchSnapshot = await db
          .collection('posts')
          .where('authorUid', 'in', batch)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();
        
        const batchPosts = batchSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        posts = [...posts, ...batchPosts];
      }
      
      // Sort by createdAt and limit
      posts = posts
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        })
        .slice(0, limit);
    }

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
    // Get posts ordered by engagement score (likes + comments * 2)
    // For now, we'll order by likes + comments, but ideally we'd calculate engagement score
    const postsSnapshot = await db
      .collection('posts')
      .orderBy('likes', 'desc')
      .limit(limit * 2) // Get more to filter
      .get();

    const posts = postsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        const engagement = (data.likes || 0) + (data.comments || 0) * 2;
        return {
          id: doc.id,
          ...data,
          engagement,
        };
      })
      .sort((a, b) => b.engagement - a.engagement)
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