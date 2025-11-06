
import { FieldValue, Timestamp } from 'firebase/firestore';

export interface EducationHistory {
  id: string;
  name: string;
  level: string;
  startYear: string;
  endYear: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  bio?: string;
  avatarUrl: string;
  isSuperAdmin: boolean;
  isPartner?: boolean;
  partnerId?: string;
  partnerApplicationId?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  referralCode: string;
  settings: {
    restrictSpending: boolean;
    restrictChat: boolean;
    restrictTalentHub: boolean;
  },
  wallet: {
      knowledgeCoins: number;
  },
  knowledgePoints: number;
  grade?: string;
  school?: string;
  educationHistory?: EducationHistory[];
  syllabus?: string;
  medium?: string;
  interests?: string[];
  sports?: string[];
}

export interface Post {
    id: string;
    author: {
        uid: string;
        name: string;
        avatarUrl: string;
    };
    content: string;
    imageUrl?: string;
    postType: 'text' | 'image' | 'video' | 'question';
    subject: string;
    likes: number;
    comments: number;
    createdAt: Timestamp; 
}


export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  imageUrl: string;
  subject: string;
  enrollmentCount?: number;
  createdAt?: FieldValue;
  duration?: string;
  knowledgeCoins?: number;
  startDate?: Timestamp | Date;
  partnerId?: string;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  description:string;
  createdAt?: FieldValue;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  contentType: 'video' | 'text' | 'pdf' | 'presentation';
  content?: string; // For text-based content
  contentUrl?: string; // For video, pdf, presentation
  description?: string;
}

export interface LessonContent {
  courseTitle: string;
  lessonTitle: string;
  contentUrl?: string;
  notes: string;
}

export interface StudyRoom {
  id: string;
  name:string;
  description: string;
  subject: string;
  hostId: string;
  hostName: string;
  imageUrl: string;
  participantCount: number;
  status: 'live' | 'upcoming' | 'ended';
  roomType: 'chat' | 'video' | 'audio';
  scheduledAt: Timestamp;
  createdAt?: FieldValue;
}

export interface Transaction {
  id: string;
  description: string;
  points: number;
  transactionType: 'earn' | 'spend';
  createdAt: Timestamp;
}

export interface Tutor extends User {
    // The courses and studyRoomsCount will be fetched separately
    // and combined with the User data in the component.
}

export interface Contest {
    id: string;
    title: string;
    description: string;
    entryFee: number;
    prize: number;
    status: 'live' | 'upcoming' | 'finished';
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    participantCount: number;
    partnerId?: string;
    imageUrl?: string;
}


// Progress Tracking Types
export interface LessonProgress {
  completed: boolean;
  completedAt?: Timestamp;
}

export interface ChapterProgress {
  lessons: {
    [lessonId: string]: LessonProgress;
  };
  completionPercentage: number;
}

export interface Progress {
  chapters: {
    [chapterId: string]: ChapterProgress;
  };
  overallPercentage: number;
}

export interface Enrollment {
  id: string; // Corresponds to courseId
  courseId: string;
  courseTitle: string;
  courseInstructor: string;
  courseImageUrl: string;
  enrolledAt: Timestamp;
  progress: Progress;
  lastAccessed?: Timestamp;
}

export interface Quest {
    id: string;
    name: string;
    subject: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    icon: string;
    description: string;
}
  
export interface UserQuestProgress {
    completedQuests: string[];
}

export interface EconomySettings {
  // Earning
  rewardForGameWin: number;
  rewardForPostCreation: number;
  rewardForCourseCompletion: number;
  signupBonus: number;
  referralBonus: number;
  
  // Spending
  costForAITask: number;

  // Conversion & Commission
  coinsPerRupee: number;
  platformFeePercent: number; // Commission on tutor earnings, partner sales, etc.
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'Course Coupon' | 'eBook' | 'Profile Badge';
  pointsRequired: number;
  inventory: number;
}

export interface TalentEntry {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  category: 'Music' | 'Art' | 'Performance' | 'Mini Skits' | 'Puppet Show' | 'Story Telling' | 'Magic' | 'Comedy';
  author: {
    uid: string;
    name: string;
    avatarUrl: string;
  };
  likes: number;
  comments: number;
}

export interface Coupon {
    id: string;
    code: string;
    description: string;
    type: 'percentage' | 'fixed_amount';
    value: number;
    expiryDate: string; // ISO date string
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: string;
    pricePeriod: string;
    features: string[];
    isPopular?: boolean;
}

export interface CoinBundle {
    id: string;
    coins: number;
    price: string;
    isPopular?: boolean;
}

export interface Notification {
  id: string;
  type: 'new_follower' | 'course_enrollment' | 'contest_win' | 'post_like' | 'post_comment';
  actor: {
    name: string;
    avatarUrl: string;
    uid: string;
  };
  data?: {
    courseName?: string;
    contestName?: string;
    postId?: string;
  };
  timestamp: Date | any; // Can be Firestore Timestamp
  read: boolean;
}

export interface Partner {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  bannerUrl: string;
  websiteUrl: string;
  promotionalVideoUrl?: string;
  contactEmail: string;
  description: string;
  achievements?: string[];
  stats: {
    studentsTaught: number;
    coursesOffered: number;
    expertTutors: number;
  };
}

export interface PartnerApplication {
    id: string;
    entityName: string;
    entityType: 'individual' | 'organization' | 'institution';
    areaOfExpertise: string;
    contactName: string;
    contactEmail: string;
    contactMobile: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string; // ISO date string
}

export interface PartnerCourse {
  id: string;
  title: string;
  category: string;
  enrolled: number;
  imageUrl: string;
  partnerId: string;
}

export interface PartnerProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  priceInRupees?: number;
  priceInCoins?: number;
  partnerId: string;
}

// CHAT-RELATED TYPES

export interface Chat {
  id: string;
  participants: string[]; // Array of user UIDs
  participantDetails: {
    [uid: string]: {
      name: string;
      avatarUrl: string;
      uid: string;
    };
  };
  type: 'private' | 'group';
  lastMessage: {
    content: string;
    timestamp: Timestamp;
    senderId: string;
  } | null;
  createdAt: Timestamp;
  name?: string; // For group chats
  description?: string; // For group chats
  photoUrl?: string; // For group chats
}

export interface ChatMessage {
  id: string;
  authorUid: string;
  content: string;
  timestamp: Timestamp;
  type: 'text' | 'image' | 'file';
  readBy: string[];
  reactions?: {
    [emoji: string]: string[]; // emoji: [uid1, uid2]
  };
}
