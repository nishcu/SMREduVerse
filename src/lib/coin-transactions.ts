'use server';

import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface TransactionMetadata {
  activityId?: string;
  activityType?: 'challenge' | 'contest' | 'study_room' | 'game' | 'marketplace' | 'course' | 'other';
  activityTitle?: string;
  recipientId?: string;
  recipientName?: string;
  [key: string]: any;
}

/**
 * Deduct coins from a user's wallet
 */
export async function deductCoins(
  userId: string,
  amount: number,
  description: string,
  metadata?: TransactionMetadata
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const db = getAdminDb();

  try {
    const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);

    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userProfileRef);
      
      if (!userDoc.exists) {
        throw new Error('User profile not found.');
      }

      const wallet = userDoc.data()?.wallet || { knowledgeCoins: 0 };
      const currentBalance = wallet.knowledgeCoins || 0;

      if (currentBalance < amount) {
        throw new Error(`Insufficient Knowledge Coins. Required: ${amount}, Available: ${currentBalance}`);
      }

      const newBalance = currentBalance - amount;

      // Update wallet
      transaction.update(userProfileRef, {
        'wallet.knowledgeCoins': newBalance,
      });

      // Create transaction record
      const transactionRef = userProfileRef.collection('transactions').doc();
      transaction.set(transactionRef, {
        description,
        points: -amount,
        transactionType: 'spend',
        createdAt: FieldValue.serverTimestamp(),
        ...metadata,
      });

      return { newBalance };
    });

    return { success: true, newBalance: result.newBalance };
  } catch (error: any) {
    console.error('Error deducting coins:', error);
    return { success: false, error: error.message || 'Failed to deduct coins.' };
  }
}

/**
 * Award coins to a user's wallet
 */
export async function awardCoins(
  userId: string,
  amount: number,
  description: string,
  metadata?: TransactionMetadata
): Promise<{ success: boolean; error?: string; newBalance?: number }> {
  const db = getAdminDb();

  try {
    const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);

    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userProfileRef);
      
      if (!userDoc.exists) {
        throw new Error('User profile not found.');
      }

      const wallet = userDoc.data()?.wallet || { knowledgeCoins: 0 };
      const currentBalance = wallet.knowledgeCoins || 0;
      const newBalance = currentBalance + amount;

      // Update wallet
      transaction.update(userProfileRef, {
        'wallet.knowledgeCoins': newBalance,
        'knowledgePoints': FieldValue.increment(amount), // Also update lifetime points
      });

      // Create transaction record
      const transactionRef = userProfileRef.collection('transactions').doc();
      transaction.set(transactionRef, {
        description,
        points: amount,
        transactionType: 'earn',
        createdAt: FieldValue.serverTimestamp(),
        ...metadata,
      });

      return { newBalance };
    });

    return { success: true, newBalance: result.newBalance };
  } catch (error: any) {
    console.error('Error awarding coins:', error);
    return { success: false, error: error.message || 'Failed to award coins.' };
  }
}

/**
 * Transfer coins from one user to another (with platform commission)
 */
export async function transferCoins(
  fromUserId: string,
  toUserId: string,
  amount: number,
  description: string,
  platformFeePercent: number = 0,
  metadata?: TransactionMetadata
): Promise<{ success: boolean; error?: string; transferredAmount?: number }> {
  const db = getAdminDb();

  try {
    const fromUserRef = db.doc(`users/${fromUserId}/profile/${fromUserId}`);
    const toUserRef = db.doc(`users/${toUserId}/profile/${toUserId}`);

    const platformFee = Math.floor(amount * platformFeePercent / 100);
    const transferredAmount = amount - platformFee;

    const result = await db.runTransaction(async (transaction) => {
      // Check from user balance
      const fromUserDoc = await transaction.get(fromUserRef);
      if (!fromUserDoc.exists) {
        throw new Error('Sender profile not found.');
      }

      const fromWallet = fromUserDoc.data()?.wallet || { knowledgeCoins: 0 };
      if ((fromWallet.knowledgeCoins || 0) < amount) {
        throw new Error('Insufficient Knowledge Coins.');
      }

      // Check to user exists
      const toUserDoc = await transaction.get(toUserRef);
      if (!toUserDoc.exists) {
        throw new Error('Recipient profile not found.');
      }

      // Deduct from sender
      transaction.update(fromUserRef, {
        'wallet.knowledgeCoins': FieldValue.increment(-amount),
      });

      // Add to recipient
      transaction.update(toUserRef, {
        'wallet.knowledgeCoins': FieldValue.increment(transferredAmount),
        'knowledgePoints': FieldValue.increment(transferredAmount),
      });

      // Create transaction record for sender
      const fromTransactionRef = fromUserRef.collection('transactions').doc();
      transaction.set(fromTransactionRef, {
        description: `${description} (to ${toUserId})`,
        points: -amount,
        transactionType: 'spend',
        createdAt: FieldValue.serverTimestamp(),
        ...metadata,
        recipientId: toUserId,
      });

      // Create transaction record for recipient
      const toTransactionRef = toUserRef.collection('transactions').doc();
      transaction.set(toTransactionRef, {
        description: `${description} (from ${fromUserId})`,
        points: transferredAmount,
        transactionType: 'earn',
        createdAt: FieldValue.serverTimestamp(),
        ...metadata,
        senderId: fromUserId,
      });

      return { transferredAmount };
    });

    return { success: true, transferredAmount: result.transferredAmount };
  } catch (error: any) {
    console.error('Error transferring coins:', error);
    return { success: false, error: error.message || 'Failed to transfer coins.' };
  }
}

/**
 * Check if user has sufficient balance
 */
export async function checkBalance(
  userId: string,
  requiredAmount: number
): Promise<{ success: boolean; hasBalance: boolean; currentBalance?: number; error?: string }> {
  const db = getAdminDb();

  try {
    const userProfileRef = db.doc(`users/${userId}/profile/${userId}`);
    const userDoc = await userProfileRef.get();

    if (!userDoc.exists) {
      return { success: false, hasBalance: false, error: 'User profile not found.' };
    }

    const wallet = userDoc.data()?.wallet || { knowledgeCoins: 0 };
    const currentBalance = wallet.knowledgeCoins || 0;

    return {
      success: true,
      hasBalance: currentBalance >= requiredAmount,
      currentBalance,
    };
  } catch (error: any) {
    console.error('Error checking balance:', error);
    return { success: false, hasBalance: false, error: error.message || 'Failed to check balance.' };
  }
}

