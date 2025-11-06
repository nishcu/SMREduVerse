
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
    
    // Fetch the user's profile to get their name and avatar
    const userProfileSnap = await db.collection('users').doc(uid).collection('profile').limit(1).get();
    if (userProfileSnap.empty) {
        throw new Error('User profile not found.');
    }
    const userProfile = userProfileSnap.docs[0].data();

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

    // Fetch the user's profile
    const userProfileSnap = await db.collection('users').doc(uid).collection('profile').limit(1).get();
    if (userProfileSnap.empty) {
      throw new Error('User profile not found.');
    }
    const userProfile = userProfileSnap.docs[0].data();

    // Create comment
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
    await postRef.update({
      comments: FieldValue.increment(1),
    });

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