'use server';
import { getAdminDb } from '@/lib/firebase-admin-new';
import type { Partner, PartnerCourse, PartnerProduct, Contest } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function getAllPartnersAction(): Promise<{ success: boolean; data?: Partner[]; error?: string }> {
  const db = getAdminDb();
  
  try {
    const snapshot = await db.collection('partners').get();
    const partners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Partner));
    return { success: true, data: partners };
  } catch (error: any) {
    console.error("Error fetching partners from Firestore:", error);
    return { success: false, error: error.message };
  }
}

export async function getPartnerDataAction(partnerId: string): Promise<{
    success: boolean;
    data?: {
        partner: Partner;
        courses: PartnerCourse[];
        products: PartnerProduct[];
        contests: Contest[];
    };
    error?: string;
}> {
    const db = getAdminDb();

    try {
        const partnerRef = db.collection('partners').doc(partnerId);
        const partnerSnap = await partnerRef.get();

        if (!partnerSnap.exists) {
            return { success: false, error: 'Partner not found.' };
        }

        const partner = { id: partnerSnap.id, ...partnerSnap.data() } as Partner;

        // Fetch related data
        const coursesPromise = db.collection('courses').where('partnerId', '==', partnerId).get();
        const productsPromise = db.collection('products').where('partnerId', '==', partnerId).get();
        const contestsPromise = db.collection('contests').where('partnerId', '==', partnerId).get();

        const [coursesSnap, productsSnap, contestsSnap] = await Promise.all([coursesPromise, productsPromise, contestsPromise]);

        const courses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerCourse));
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerCourse));
        const contests = contestsSnap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            startDate: (doc.data().startDate as Timestamp).toDate().toISOString(),
            endDate: (doc.data().endDate as Timestamp).toDate().toISOString(),
        } as Contest));

        return {
            success: true,
            data: {
                partner,
                courses,
                products,
                contests,
            },
        };
    } catch (error: any) {
        console.error(`Error fetching data for partner ${partnerId}:`, error);
        return { success: false, error: error.message };
    }
}