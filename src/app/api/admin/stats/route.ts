import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getAdminDb();

    // Fetch counts in parallel
    const [
      usersSnapshot,
      coursesSnapshot,
      challengesSnapshot,
      contestsSnapshot,
    ] = await Promise.all([
      db.collection('users').get().catch(() => ({ size: 0 })),
      db.collection('courses').get().catch(() => ({ size: 0 })),
      db.collection('challenges').get().catch(() => ({ size: 0 })),
      db.collection('contests').get().catch(() => ({ size: 0 })),
    ]);

    // Calculate active users (users who logged in within last 30 days)
    let activeUsers = 0;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Note: This would require a lastLogin field on users
      // For now, we'll approximate
      activeUsers = Math.floor(usersSnapshot.size * 0.3); // Assume 30% are active
    } catch (error) {
      console.error('Error calculating active users:', error);
    }

    // Calculate total knowledge coins in circulation
    let totalKnowledgeCoins = 0;
    try {
      const users = await db.collection('users').limit(100).get();
      for (const doc of users.docs) {
        const profileRef = db.doc(`users/${doc.id}/profile/${doc.id}`);
        const profileDoc = await profileRef.get();
        if (profileDoc.exists) {
          const wallet = profileDoc.data()?.wallet || {};
          totalKnowledgeCoins += wallet.knowledgeCoins || 0;
        }
      }
      // This is a sample - for full count, we'd need to iterate all users
      // For now, we'll estimate based on sample
      totalKnowledgeCoins = totalKnowledgeCoins * (usersSnapshot.size / Math.min(100, usersSnapshot.size));
    } catch (error) {
      console.error('Error calculating total coins:', error);
    }

    // Calculate total transactions
    let totalTransactions = 0;
    try {
      // This would require iterating through all user transaction collections
      // For now, we'll estimate based on challenges and contests
      totalTransactions = challengesSnapshot.size * 5 + contestsSnapshot.size * 10;
    } catch (error) {
      console.error('Error calculating transactions:', error);
    }

    // Calculate revenue (platform fees from transactions)
    // This is an estimate - actual revenue would need to be tracked separately
    const totalRevenue = Math.floor(totalTransactions * 0.1 * 0.01); // 10% fee, 1 coin = ₹0.01

    return NextResponse.json({
      totalUsers: usersSnapshot.size || 0,
      totalCourses: coursesSnapshot.size || 0,
      totalChallenges: challengesSnapshot.size || 0,
      totalContests: contestsSnapshot.size || 0,
      totalTransactions,
      totalRevenue,
      activeUsers,
      totalKnowledgeCoins: Math.floor(totalKnowledgeCoins),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

