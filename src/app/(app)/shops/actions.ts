
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { PartnerProduct } from '@/lib/types';

export async function getAllProductsAction(): Promise<{ success: boolean; data?: PartnerProduct[]; error?: string }> {
  const { db } = await getFirebaseAdmin();
  if (!db) {
    return { success: false, error: 'Database not initialized.' };
  }
  
  try {
    const snapshot = await db.collectionGroup('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerProduct));
    return { success: true, data: products };
  } catch (error: any) {
    console.error("Error fetching all products from Firestore:", error);
    return { success: false, error: error.message };
  }
}
