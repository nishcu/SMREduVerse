import { getAdminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getAdminDb();

    // Fetch recent transactions from all users
    // Note: This is a simplified version - in production, you'd want to paginate
    const transactions: any[] = [];
    const stats = {
      totalEarnings: 0,
      totalSpending: 0,
      totalTransactions: 0,
      platformRevenue: 0,
    };

    try {
      // Get a sample of users (first 50)
      const usersSnapshot = await db.collection('users').limit(50).get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const profileRef = db.doc(`users/${userId}/profile/${userId}`);
        const profileDoc = await profileRef.get();
        const userName = profileDoc.data()?.name || 'Unknown';

        // Get recent transactions for this user
        const transactionsRef = db
          .collection(`users/${userId}/transactions`)
          .orderBy('createdAt', 'desc')
          .limit(10);

        try {
          const transactionsSnapshot = await transactionsRef.get();
          
          for (const txDoc of transactionsSnapshot.docs) {
            const txData = txDoc.data();
            const amount = txData.points || 0;
            const type = txData.transactionType || 'other';

            if (type === 'earn') {
              stats.totalEarnings += amount;
            } else if (type === 'spend') {
              stats.totalSpending += amount;
            }

            transactions.push({
              id: txDoc.id,
              userId,
              userName,
              type: type === 'earn' ? 'earn' : type === 'spend' ? 'spend' : 'transfer',
              amount: Math.abs(amount),
              description: txData.description || 'Transaction',
              activityType: txData.activityType,
              activityTitle: txData.activityTitle,
              createdAt: txData.createdAt?.toDate?.() || new Date(txData.createdAt) || new Date(),
            });
          }
        } catch (error) {
          // Skip users with no transactions
          continue;
        }
      }

      // Sort by date (newest first)
      transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Take only the most recent 100
      const recentTransactions = transactions.slice(0, 100);

      stats.totalTransactions = recentTransactions.length;
      stats.platformRevenue = Math.floor(stats.totalSpending * 0.1 * 0.01); // 10% fee, 1 coin = ₹0.01

      return NextResponse.json({
        transactions: recentTransactions,
        stats,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({
        transactions: [],
        stats,
      });
    }
  } catch (error: any) {
    console.error('Error in transactions route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

