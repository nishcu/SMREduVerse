
'use server';

import { performSearch } from '@/server/search';

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
    return performSearch(query);
}
