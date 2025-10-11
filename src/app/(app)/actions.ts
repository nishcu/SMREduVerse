
'use server';

import { getAdminDb } from '@/lib/firebase-admin-new';

export async function searchAction(query: string): Promise<{ users: any[], courses: any[], posts: any[] }> {
    const db = getAdminDb();
    if (!query || query.trim().length < 2) {
        return { users: [], courses: [], posts: [] };
    }

    const sanitizedQuery = query.toLowerCase();

    // In a production app, you'd use a dedicated search service like Algolia or MeiliSearch
    // for efficient text search. Firestore's native capabilities are limited.
    // Here we simulate a search by fetching and filtering. This is NOT scalable,
    // but we can limit the documents fetched to improve performance slightly.
    const limit = 100; // Limit docs to avoid fetching the entire collection

    // Search Users
    const usersPromise = db.collectionGroup('profile').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => 
                user.name?.toLowerCase().includes(sanitizedQuery) ||
                user.username?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 3);
    });

    // Search Courses
    const coursesPromise = db.collection('courses').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(course => 
                course.title?.toLowerCase().includes(sanitizedQuery) ||
                course.description?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 3);
    });

    // Search Posts
    const postsPromise = db.collection('posts').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(post => 
                post.content?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 3);
    });

    const [users, courses, posts] = await Promise.all([usersPromise, coursesPromise, postsPromise]);
    
    return { users, courses, posts };
}
