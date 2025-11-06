
'use server';

import { getAdminDb } from '@/lib/firebase-admin';

export async function searchAction(query: string): Promise<{ 
    users: any[], 
    courses: any[], 
    posts: any[],
    challenges: any[],
    contests: any[],
    marketplace: any[],
    partners: any[],
    studyRooms: any[]
}> {
    const db = getAdminDb();
    if (!query || query.trim().length < 2) {
        return { 
            users: [], 
            courses: [], 
            posts: [],
            challenges: [],
            contests: [],
            marketplace: [],
            partners: [],
            studyRooms: []
        };
    }

    const sanitizedQuery = query.toLowerCase();

    // In a production app, you'd use a dedicated search service like Algolia or MeiliSearch
    // for efficient text search. Firestore's native capabilities are limited.
    // Here we simulate a search by fetching and filtering. This is NOT scalable,
    // but we can limit the documents fetched to improve performance slightly.
    const limit = 50; // Limit docs per collection to avoid fetching too much

    // Search Users (including tutors)
    const usersPromise = db.collectionGroup('profile').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => 
                user.name?.toLowerCase().includes(sanitizedQuery) ||
                user.username?.toLowerCase().includes(sanitizedQuery) ||
                user.bio?.toLowerCase().includes(sanitizedQuery) ||
                user.email?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    // Search Courses
    const coursesPromise = db.collection('courses').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(course => 
                course.title?.toLowerCase().includes(sanitizedQuery) ||
                course.description?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    // Search Posts
    const postsPromise = db.collection('posts').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(post => 
                post.content?.toLowerCase().includes(sanitizedQuery) ||
                post.title?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    // Search Challenges
    const challengesPromise = db.collection('challenges').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(challenge => 
                challenge.title?.toLowerCase().includes(sanitizedQuery) ||
                challenge.description?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    // Search Contests
    const contestsPromise = db.collection('contests').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(contest => 
                contest.title?.toLowerCase().includes(sanitizedQuery) ||
                contest.description?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    // Search Marketplace Content
    const marketplacePromise = db.collection('marketplace').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => 
                item.title?.toLowerCase().includes(sanitizedQuery) ||
                item.description?.toLowerCase().includes(sanitizedQuery) ||
                item.category?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    // Search Partners
    const partnersPromise = db.collection('partners').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(partner => 
                partner.name?.toLowerCase().includes(sanitizedQuery) ||
                partner.description?.toLowerCase().includes(sanitizedQuery) ||
                partner.location?.toLowerCase().includes(sanitizedQuery) ||
                partner.type?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    // Search Study Rooms
    const studyRoomsPromise = db.collection('study-rooms').limit(limit).get().then(snapshot => {
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(room => 
                room.name?.toLowerCase().includes(sanitizedQuery) ||
                room.description?.toLowerCase().includes(sanitizedQuery) ||
                room.subject?.toLowerCase().includes(sanitizedQuery)
            ).slice(0, 5);
    });

    const [users, courses, posts, challenges, contests, marketplace, partners, studyRooms] = await Promise.all([
        usersPromise, 
        coursesPromise, 
        postsPromise,
        challengesPromise,
        contestsPromise,
        marketplacePromise,
        partnersPromise,
        studyRoomsPromise
    ]);
    
    return { 
        users, 
        courses, 
        posts,
        challenges,
        contests,
        marketplace,
        partners,
        studyRooms
    };
}
