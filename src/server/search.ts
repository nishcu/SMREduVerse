import { getAdminDb } from '@/lib/firebase-admin';

export type SearchResults = {
  users: any[];
  courses: any[];
  posts: any[];
  challenges: any[];
  contests: any[];
  marketplace: any[];
  partners: any[];
  studyRooms: any[];
};

export async function performSearch(query: string): Promise<SearchResults> {
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
      studyRooms: [],
    };
  }

  const sanitizedQuery = query.toLowerCase();
  const limit = 50;

  const usersPromise = db
    .collectionGroup('profile')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => {
          const name = user.name?.toLowerCase() || '';
          const username = user.username?.toLowerCase() || '';
          const bio = user.bio?.toLowerCase() || '';
          const email = user.email?.toLowerCase() || '';
          return (
            name.includes(sanitizedQuery) ||
            username.includes(sanitizedQuery) ||
            bio.includes(sanitizedQuery) ||
            email.includes(sanitizedQuery)
          );
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching users:', error);
      return [];
    });

  const coursesPromise = db
    .collection('courses')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((course) => {
          const title = course.title?.toLowerCase() || '';
          const description = course.description?.toLowerCase() || '';
          return title.includes(sanitizedQuery) || description.includes(sanitizedQuery);
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching courses:', error);
      return [];
    });

  const postsPromise = db
    .collection('posts')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((post) => {
          const content = post.content?.toLowerCase() || '';
          const title = post.title?.toLowerCase() || '';
          return content.includes(sanitizedQuery) || title.includes(sanitizedQuery);
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching posts:', error);
      return [];
    });

  const challengesPromise = db
    .collection('challenges')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((challenge) => {
          const title = challenge.title?.toLowerCase() || '';
          const description = challenge.description?.toLowerCase() || '';
          return title.includes(sanitizedQuery) || description.includes(sanitizedQuery);
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching challenges:', error);
      return [];
    });

  const contestsPromise = db
    .collection('contests')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((contest) => {
          const title = contest.title?.toLowerCase() || '';
          const description = contest.description?.toLowerCase() || '';
          return title.includes(sanitizedQuery) || description.includes(sanitizedQuery);
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching contests:', error);
      return [];
    });

  const marketplacePromise = db
    .collection('marketplace')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => {
          const title = item.title?.toLowerCase() || '';
          const description = item.description?.toLowerCase() || '';
          const category = item.category?.toLowerCase() || '';
          return (
            title.includes(sanitizedQuery) ||
            description.includes(sanitizedQuery) ||
            category.includes(sanitizedQuery)
          );
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching marketplace:', error);
      return [];
    });

  const partnersPromise = db
    .collection('partners')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((partner) => {
          const name = partner.name?.toLowerCase() || '';
          const description = partner.description?.toLowerCase() || '';
          const location = partner.location?.toLowerCase() || '';
          const type = partner.type?.toLowerCase() || '';
          return (
            name.includes(sanitizedQuery) ||
            description.includes(sanitizedQuery) ||
            location.includes(sanitizedQuery) ||
            type.includes(sanitizedQuery)
          );
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching partners:', error);
      return [];
    });

  const studyRoomsPromise = db
    .collection('study-rooms')
    .limit(limit)
    .get()
    .then((snapshot) => {
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((room) => {
          const name = room.name?.toLowerCase() || '';
          const description = room.description?.toLowerCase() || '';
          const subject = room.subject?.toLowerCase() || '';
          return (
            name.includes(sanitizedQuery) ||
            description.includes(sanitizedQuery) ||
            subject.includes(sanitizedQuery)
          );
        })
        .slice(0, 5);
    })
    .catch((error) => {
      console.error('Error searching study rooms:', error);
      return [];
    });

  const [users, courses, posts, challenges, contests, marketplace, partners, studyRooms] =
    await Promise.all([
      usersPromise,
      coursesPromise,
      postsPromise,
      challengesPromise,
      contestsPromise,
      marketplacePromise,
      partnersPromise,
      studyRoomsPromise,
    ]);

  return {
    users,
    courses,
    posts,
    challenges,
    contests,
    marketplace,
    partners,
    studyRooms,
  };
}

