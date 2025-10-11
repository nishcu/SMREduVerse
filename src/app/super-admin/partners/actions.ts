
'use server';

import { z } from 'zod';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin-new';
import { revalidatePath } from 'next/cache';
import type { Partner, PartnerApplication, User } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

const PartnerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    tagline: z.string().min(1, 'Tagline is required'),
    logoUrl: z.string().url('Invalid URL for logo').optional().or(z.literal('')),
    bannerUrl: z.string().url('Invalid URL for banner').optional().or(z.literal('')),
    websiteUrl: z.string().url('Invalid URL for website').optional().or(z.literal('')),
    promotionalVideoUrl: z.string().url('Invalid URL for video').optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address'),
    description: z.string().min(1, 'Description is required'),
    studentsTaught: z.coerce.number().min(0),
    coursesOffered: z.coerce.number().min(0),
    expertTutors: z.coerce.number().min(0),
    achievements: z.array(z.string()).optional(),
});

export async function savePartnerAction(prevState: any, formData: FormData) {
    const db = getAdminDb();
    
    const validatedFields = PartnerSchema.safeParse({
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        tagline: formData.get('tagline'),
        logoUrl: formData.get('logoUrl'),
        bannerUrl: formData.get('bannerUrl'),
        websiteUrl: formData.get('websiteUrl'),
        promotionalVideoUrl: formData.get('promotionalVideoUrl'),
        contactEmail: formData.get('contactEmail'),
        description: formData.get('description'),
        studentsTaught: formData.get('studentsTaught'),
        coursesOffered: formData.get('coursesOffered'),
        expertTutors: formData.get('expertTutors'),
        achievements: formData.getAll('achievements'),
    });

    if (!validatedFields.success) {
        return { 
            success: false, 
            error: 'Invalid data provided.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { id, studentsTaught, coursesOffered, expertTutors, achievements: validatedAchievements, ...rest } = validatedFields.data;

    try {
        const partnerData = {
            ...rest,
            achievements: validatedAchievements || [],
            stats: {
                studentsTaught,
                coursesOffered,
                expertTutors,
            }
        };

        let partnerId = id;
        if (id) {
            await db.collection('partners').doc(id).set(partnerData, { merge: true });
        } else {
            const newDocRef = await db.collection('partners').add(partnerData);
            partnerId = newDocRef.id;
        }

        revalidatePath('/super-admin/partners');
        revalidatePath('/partners');
        if (partnerId) {
            revalidatePath(`/partners/${partnerId}`);
        }
        
        const finalDataDoc = await db.collection('partners').doc(partnerId as string).get();
        const finalData = { id: finalDataDoc.id, ...finalDataDoc.data() } as Partner;
        
        return { success: true, data: finalData };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deletePartnerAction(id: string) {
    const db = getAdminDb();

    try {
        await db.collection('partners').doc(id).delete();
        revalidatePath('/super-admin/partners');
        revalidatePath('/partners');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getPartnersAction() {
    const db = getAdminDb();

    try {
        const snapshot = await db.collection('partners').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Partner[];
    } catch (error) {
        console.error("Error fetching partners: ", error);
        return [];
    }
}

export async function getPartnerApplicationsAction(status: 'pending' | 'approved' | 'rejected'): Promise<PartnerApplication[]> {
    const db = getAdminDb();

    try {
        const snapshot = await db.collection('partner-applications').where('status', '==', status).orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString() : '',
            }
        }) as PartnerApplication[];
    } catch (error) {
        console.error("Error fetching partner applications:", error);
        return [];
    }
}

const PartnerApplicationSchema = z.object({
    entityName: z.string().min(1, 'Entity name is required'),
    entityType: z.enum(['individual', 'organization', 'institution']),
    areaOfExpertise: z.string().min(1, 'Area of expertise is required'),
    contactName: z.string().min(1, 'Contact name is required'),
    contactEmail: z.string().email('A valid email is required'),
    contactMobile: z.string().min(10, 'A valid mobile number is required'),
    userId: z.string().min(1, 'User ID is required.'),
});

export async function createPartnerApplicationAction(data: z.infer<typeof PartnerApplicationSchema>) {
    const db = getAdminDb();
    
    try {
        const payload = {
            ...data,
            status: 'pending' as const,
            createdAt: FieldValue.serverTimestamp(),
        };
        const appRef = await db.collection('partner-applications').add(payload);
        
        const userProfileCollectionRef = db.collection(`users/${data.userId}/profile`);
        const userProfileSnapshot = await userProfileCollectionRef.limit(1).get();
        
        if (!userProfileSnapshot.empty) {
            const userProfileDocRef = userProfileSnapshot.docs[0].ref;
            await userProfileDocRef.set({ partnerApplicationId: appRef.id }, { merge: true });
        }

        revalidatePath('/super-admin/partners');
        return { success: true, error: null, errors: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approvePartnerApplicationAction(applicationId: string, userId: string) {
    const db = getAdminDb();
    
    const appRef = db.doc(`partner-applications/${applicationId}`);
    const userProfileCollectionRef = db.collection(`users/${userId}/profile`);
    
    try {
        const appSnap = await appRef.get();
        if (!appSnap.exists) {
            throw new Error('Application not found.');
        }
        const appData = appSnap.data() as PartnerApplication;

        const newPartnerData: Omit<Partner, 'id'> = {
            name: appData.entityName,
            tagline: `Experts in ${appData.areaOfExpertise}`,
            logoUrl: 'https://picsum.photos/seed/new-partner-logo/200/200',
            bannerUrl: 'https://picsum.photos/seed/new-partner-banner/1200/400',
            websiteUrl: '',
            contactEmail: appData.contactEmail,
            description: `A new partner specializing in ${appData.areaOfExpertise}.`,
            stats: {
                studentsTaught: 0,
                coursesOffered: 0,
                expertTutors: 0,
            }
        };
        
        const newPartner = await db.runTransaction(async (transaction) => {
            const userProfileSnapshot = await transaction.get(userProfileCollectionRef.limit(1));
            
            if (userProfileSnapshot.empty) {
                throw new Error(`Profile for user ${userId} not found.`);
            }
            const userProfileDocRef = userProfileSnapshot.docs[0].ref;
            
            const newPartnerRef = db.collection('partners').doc();
            transaction.set(newPartnerRef, newPartnerData);

            transaction.update(userProfileDocRef, {
                partnerId: newPartnerRef.id,
            });

            transaction.update(appRef, {
                status: 'approved',
            });
            
            return { id: newPartnerRef.id, ...newPartnerData };
        });


        revalidatePath('/super-admin/partners');
        revalidatePath(`/profile/${userId}`);
        revalidatePath(`/partners/${newPartner.id}`);
        
        return { success: true, data: newPartner as Partner };
        
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function rejectPartnerApplicationAction(applicationId: string) {
    const db = getAdminDb();

    try {
        await db.doc(`partner-applications/${applicationId}`).update({ status: 'rejected' });
        revalidatePath('/super-admin/partners');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
