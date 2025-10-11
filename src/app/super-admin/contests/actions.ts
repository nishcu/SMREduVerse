'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { Timestamp } from 'firebase-admin/firestore';
import type { Contest } from '@/lib/types';

const ContestSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    entryFee: z.coerce.number().min(0),
    prize: z.coerce.number().min(0),
    status: z.enum(['upcoming', 'live', 'finished']),
    startDate: z.date(),
    endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
});


export async function saveContestAction(prevState: any, formData: FormData) {
    const { db } = getFirebaseAdmin();
    if (!db) {
        return { success: false, error: 'Database not initialized' };
    }

    const id = formData.get('id') as string | null;

    const validatedFields = ContestSchema.safeParse({
        title: formData.get('title'),
        description: formData.get('description'),
        entryFee: formData.get('entryFee'),
        prize: formData.get('prize'),
        status: formData.get('status'),
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
    });

    if (!validatedFields.success) {
        return { 
            success: false, 
            error: 'Invalid data provided.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { startDate, endDate, ...rest } = validatedFields.data;

    const contestData = {
        ...rest,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
    };

    try {
        if (id) {
            await db.collection('contests').doc(id).set(contestData, { merge: true });
        } else {
            await db.collection('contests').add(contestData);
        }
        revalidatePath('/super-admin/contests');
        revalidatePath('/contests');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteContestAction(id: string) {
    const { db } = getFirebaseAdmin();
    if (!db) {
        return { success: false, error: 'Database not initialized' };
    }

    try {
        await db.collection('contests').doc(id).delete();
        revalidatePath('/super-admin/contests');
        revalidatePath('/contests');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getContestsAction() {
    const { db } = getFirebaseAdmin();
    if (!db) return [];

    try {
        const snapshot = await db.collection('contests').orderBy('startDate', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
             // Convert Timestamps to strings for serialization
            startDate: (doc.data().startDate as Timestamp).toDate().toISOString(),
            endDate: (doc.data().endDate as Timestamp).toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error fetching contests: ", error);
        return [];
    }
}
