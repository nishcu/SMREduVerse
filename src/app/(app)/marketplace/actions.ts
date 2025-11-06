'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { MarketplaceContent, ContentReview } from '@/lib/types';

const CreateContentSchema = z.object({
  idToken: z.string(),
  title: z.string().min(1, 'Title is required.').max(200, 'Title must be 200 characters or less.'),
  description: z.string().min(1, 'Description is required.').max(1000, 'Description must be 1000 characters or less.'),
  type: z.enum(['study_notes', 'video_tutorial', 'practice_quiz', 'flashcards', 'study_guide']),
  subject: z.string().min(1, 'Subject is required.'),
  grade: z.string().optional(),
  content: z.object({
    fileUrl: z.string().url().optional(),
    content: z.string().optional(),
    quizData: z.any().optional(),
  }),
  price: z.number().min(0, 'Price must be 0 or greater.'),
  tags: z.array(z.string()).optional(),
});

const CreateReviewSchema = z.object({
  idToken: z.string(),
  contentId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function createMarketplaceContentAction(formData: FormData) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const idToken = formData.get('idToken') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const subject = formData.get('subject') as string;
    const grade = formData.get('grade') as string || '';
    const fileUrl = formData.get('content.fileUrl') as string || '';
    const content = formData.get('content.content') as string || '';
    const price = formData.get('price') as string || '0';
    const tags = formData.getAll('tags[]') as string[];

    const validatedFields = CreateContentSchema.safeParse({
      idToken,
      title,
      description,
      type,
      subject,
      grade: grade || undefined,
      content: {
        fileUrl: fileUrl || undefined,
        content: content || undefined,
        quizData: undefined,
      },
      price: parseInt(price),
      tags,
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

    // Create marketplace content
    const contentData = {
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      creator: {
        uid,
        name: userProfile.name || 'Anonymous',
        avatarUrl: userProfile.avatarUrl || '',
        verified: userProfile.isSuperAdmin || false,
      },
      type: validatedFields.data.type,
      subject: validatedFields.data.subject,
      grade: validatedFields.data.grade || '',
      content: validatedFields.data.content,
      price: validatedFields.data.price,
      sales: 0,
      rating: 0,
      reviewsCount: 0,
      downloads: 0,
      tags: validatedFields.data.tags || [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      status: 'published',
    };

    const contentRef = await db.collection('marketplace-content').add(contentData);

    revalidatePath('/marketplace');
    return {
      success: true,
      contentId: contentRef.id,
    };
  } catch (error: any) {
    console.error('Error creating marketplace content:', error);
    return {
      success: false,
      error: error.message || 'Failed to create content.',
    };
  }
}

export async function purchaseContentAction(contentId: string, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch content
    const contentRef = db.collection('marketplace-content').doc(contentId);
    const contentSnap = await contentRef.get();

    if (!contentSnap.exists) {
      return {
        success: false,
        error: 'Content not found.',
      };
    }

    const content = contentSnap.data()!;

    // Check if already purchased
    const purchaseRef = db.doc(`users/${uid}/purchases/${contentId}`);
    const purchaseSnap = await purchaseRef.get();

    if (purchaseSnap.exists) {
      return {
        success: false,
        error: 'You already own this content.',
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
    const userCoins = userProfile.wallet?.knowledgeCoins || 0;

    // Check if user has enough coins
    if (userCoins < content.price) {
      return {
        success: false,
        error: 'Insufficient knowledge coins.',
      };
    }

    // Deduct coins from user
    await userProfileRef.update({
      'wallet.knowledgeCoins': FieldValue.increment(-content.price),
    });

    // Add coins to creator
    const creatorProfileRef = db.doc(`users/${content.creator.uid}/profile/${content.creator.uid}`);
    await creatorProfileRef.update({
      'wallet.knowledgeCoins': FieldValue.increment(content.price * 0.9), // Creator gets 90%
    });

    // Record purchase
    await purchaseRef.set({
      contentId,
      purchasedAt: FieldValue.serverTimestamp(),
      price: content.price,
    });

    // Update content sales
    await contentRef.update({
      sales: FieldValue.increment(1),
      downloads: FieldValue.increment(1),
    });

    // Create transaction record
    const transactionRef = db.collection(`users/${uid}/transactions`).doc();
    await transactionRef.set({
      type: 'purchase',
      amount: -content.price,
      description: `Purchased: ${content.title}`,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create transaction for creator
    const creatorTransactionRef = db.collection(`users/${content.creator.uid}/transactions`).doc();
    await creatorTransactionRef.set({
      type: 'sale',
      amount: content.price * 0.9,
      description: `Sale: ${content.title}`,
      createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/marketplace');
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error purchasing content:', error);
    return {
      success: false,
      error: error.message || 'Failed to purchase content.',
    };
  }
}

export async function createReviewAction(contentId: string, rating: number, comment: string | undefined, idToken: string) {
  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    const validatedFields = CreateReviewSchema.safeParse({
      idToken,
      contentId,
      rating,
      comment,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid review data.',
      };
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user has purchased this content
    const purchaseRef = db.doc(`users/${uid}/purchases/${contentId}`);
    const purchaseSnap = await purchaseRef.get();

    if (!purchaseSnap.exists) {
      return {
        success: false,
        error: 'You must purchase this content before reviewing.',
      };
    }

    // Check if already reviewed
    const existingReviewRef = db.collection('content-reviews')
      .where('contentId', '==', contentId)
      .where('reviewer.uid', '==', uid)
      .limit(1)
      .get();

    const existingReview = await existingReviewRef;
    if (!existingReview.empty) {
      return {
        success: false,
        error: 'You have already reviewed this content.',
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

    // Create review
    const reviewRef = db.collection('content-reviews').doc();
    await reviewRef.set({
      contentId,
      reviewer: {
        uid,
        name: userProfile.name || 'Anonymous',
        avatarUrl: userProfile.avatarUrl || '',
      },
      rating,
      comment: comment || '',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update content rating
    const contentRef = db.collection('marketplace-content').doc(contentId);
    const contentSnap = await contentRef.get();
    const content = contentSnap.data()!;

    const currentRating = content.rating || 0;
    const currentReviewsCount = content.reviewsCount || 0;
    const newRating = ((currentRating * currentReviewsCount) + rating) / (currentReviewsCount + 1);

    await contentRef.update({
      rating: newRating,
      reviewsCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath(`/marketplace/${contentId}`);
    return {
      success: true,
      reviewId: reviewRef.id,
    };
  } catch (error: any) {
    console.error('Error creating review:', error);
    return {
      success: false,
      error: error.message || 'Failed to create review.',
    };
  }
}

export async function getMarketplaceContentAction(subject?: string, type?: string, limit: number = 20) {
  const db = getAdminDb();

  try {
    // Note: Using where().orderBy() with multiple where clauses requires an index
    // So we fetch without orderBy and sort in memory
    let query: any = db.collection('marketplace-content')
      .where('status', '==', 'published');

    // Apply filters if provided
    if (subject) {
      query = query.where('subject', '==', subject);
    }

    if (type) {
      query = query.where('type', '==', type);
    }

    // Fetch all matching documents (we'll sort and limit in memory)
    const snapshot = await query.get();

    // Map and filter results
    let content = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    });

    // Apply additional filters in memory if needed (in case Firestore query didn't handle all cases)
    if (subject) {
      content = content.filter((item: any) => item.subject === subject);
    }

    if (type) {
      content = content.filter((item: any) => item.type === type);
    }

    // Sort by createdAt in memory (descending - newest first)
    content = content.sort((a: any, b: any) => {
      const aTime = typeof a.createdAt === 'string' 
        ? new Date(a.createdAt).getTime() 
        : a.createdAt?.toMillis?.() || 0;
      const bTime = typeof b.createdAt === 'string'
        ? new Date(b.createdAt).getTime()
        : b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Limit results
    content = content.slice(0, limit);

    return {
      success: true,
      content,
    };
  } catch (error: any) {
    console.error('Error fetching marketplace content:', error);
    return {
      success: false,
      error: error.message || 'Failed to load marketplace content.',
      content: [],
    };
  }
}

export async function getContentReviewsAction(contentId: string, limit: number = 20) {
  const db = getAdminDb();

  try {
    const snapshot = await db.collection('content-reviews')
      .where('contentId', '==', contentId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const reviews = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });

    return {
      success: true,
      reviews,
    };
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return {
      success: false,
      error: error.message || 'Failed to load reviews.',
      reviews: [],
    };
  }
}

