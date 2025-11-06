
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
  mobileNumber?: string;
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
    restrictAITasks: boolean;
    restrictContests: boolean;
    restrictMarketplace: boolean;
    enableActivityLogs: boolean;
  },
  // Parent-Child Relationship
  parentId?: string; // If this is a child account, reference to parent
  isChildAccount?: boolean; // Flag to identify child accounts
  children?: string[]; // If this is a parent account, list of child user IDs
  parentalCode?: string; // Secret code for parental controls (hashed)
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

// Parental Controls
export interface ParentalControlSettings {
  restrictSpending: boolean;
  restrictChat: boolean;
  restrictTalentHub: boolean;
  restrictAITasks: boolean;
  restrictContests: boolean;
  restrictMarketplace: boolean;
  enableActivityLogs: boolean;
  notificationInterval: number; // Minutes between notifications (default: 120 = 2 hours)
  lastNotificationSent?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ActivityLog {
  id: string;
  userId: string;
  activityType: 'spending' | 'chat' | 'purchase' | 'course_enrollment' | 'game_play' | 'challenge_join' | 'other';
  activityTitle: string;
  activityDetails?: string;
  metadata?: {
    amount?: number;
    itemName?: string;
    recipientId?: string;
    [key: string]: any;
  };
  timestamp: Timestamp;
}

export interface ParentNotification {
  id: string;
  parentId: string;
  childId: string;
  childName: string;
  notificationType: 'activity_summary' | 'spending_alert' | 'restriction_triggered' | 'custom';
  title: string;
  message: string;
  activities?: ActivityLog[];
  periodStart: Timestamp;
  periodEnd: Timestamp;
  read: boolean;
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

  // NEW: Activity Participation Costs
  costToJoinChallenge: number;        // Cost for participants to join challenge
  costToHostChallenge: number;         // Cost for hosts to create challenge
  costToJoinContest: number;           // Cost for participants to join contest
  costToHostContest: number;           // Cost for hosts to create contest
  costToJoinStudyRoom: number;         // Cost for participants to join study room
  costToCreateStudyRoom: number;       // Cost for hosts to create study room
  costToJoinGame: number;              // Cost for participants to join multiplayer game
  
  // NEW: Winner Rewards
  rewardForChallengeWin: number;       // First place in challenge
  rewardForChallengeSecond: number;    // Second place in challenge
  rewardForChallengeThird: number;     // Third place in challenge
  rewardForContestWin: number;         // First place in contest
  rewardForContestSecond: number;      // Second place in contest
  rewardForContestThird: number;       // Third place in contest
  
  // NEW: Host Earnings Configuration
  hostEarningPercent: number;           // % of participant fees that host earns
  participantFeePercent: number;        // % of entry fee that goes to host pool (rest goes to prize pool)
  
  // Conversion & Commission
  coinsPerRupee: number;
  platformFeePercent: number;          // Platform commission on all earnings
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
  type: 'new_follower' | 'course_enrollment' | 'contest_win' | 'post_like' | 'post_comment' | 'challenge_invite' | 'challenge_progress' | 'chat_message';
  actor: {
    name: string;
    avatarUrl: string;
    uid: string;
  };
  data?: {
    courseName?: string;
    contestName?: string;
    postId?: string;
    challengeId?: string;
    chatId?: string;
    messagePreview?: string;
  };
  timestamp: Date | any; // Can be Firestore Timestamp
  read: boolean;
}

// Feature 1: Social Learning Challenges
export interface LearningChallenge {
  id: string;
  title: string;
  description: string;
  creator: {
    uid: string;
    name: string;
    avatarUrl: string;
  };
  type: 'course_completion' | 'subject_mastery' | 'daily_goal' | 'time_based' | 'custom';
  target: {
    courseId?: string;
    subject?: string;
    goal?: string;
    duration?: number; // days
  };
  participants: string[]; // Array of user UIDs
  participantDetails: {
    [uid: string]: {
      name: string;
      avatarUrl: string;
      progress: number; // 0-100
      joinedAt: Timestamp;
    };
  };
  status: 'upcoming' | 'active' | 'completed';
  startDate: Timestamp;
  endDate?: Timestamp;
  rewards: {
    coins: number;
    points: number;
    badge?: string;
  };
  leaderboard: Array<{
    uid: string;
    name: string;
    avatarUrl: string;
    progress: number;
    rank: number;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Feature 2: AI-Powered Recommendations
export interface LearningRecommendation {
  courseId?: string;
  userId?: string; // Study buddy recommendation
  postId?: string;
  questionId?: string;
  type: 'course' | 'study_buddy' | 'content' | 'question';
  reason: string;
  score: number; // 0-100 recommendation score
  socialSignals?: {
    friendsLearning?: number;
    trending?: boolean;
  };
}

// Feature 3: Knowledge Marketplace
export interface MarketplaceContent {
  id: string;
  title: string;
  description: string;
  creator: {
    uid: string;
    name: string;
    avatarUrl: string;
    verified?: boolean;
  };
  type: 'study_notes' | 'video_tutorial' | 'practice_quiz' | 'flashcards' | 'study_guide';
  subject: string;
  grade?: string;
  content: {
    fileUrl?: string; // For PDFs, videos
    content?: string; // For text-based content
    quizData?: any; // For practice quizzes
  };
  price: number; // Knowledge Coins (0 = free)
  sales: number;
  rating: number;
  reviewsCount: number;
  downloads: number;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'draft' | 'published' | 'archived';
}

export interface ContentReview {
  id: string;
  contentId: string;
  reviewer: {
    uid: string;
    name: string;
    avatarUrl: string;
  };
  rating: number; // 1-5
  comment?: string;
  createdAt: Timestamp;
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
  // Enhanced fields for institutions
  institutionType?: 'school' | 'college' | 'university' | 'academy' | 'other';
  verified?: boolean;
  accreditation?: string[];
  location?: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
  };
  contactInfo?: {
    phone?: string;
    mobile?: string;
    email: string;
    alternateEmail?: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  programs?: {
    name: string;
    level: 'certificate' | 'diploma' | 'degree' | 'postgraduate' | 'other';
    duration?: string;
    description?: string;
  }[];
  facilities?: string[];
  establishedYear?: number;
  facultyCount?: number;
  studentCapacity?: number;
  admissionInfo?: {
    open: boolean;
    process?: string;
    requirements?: string[];
    feeStructure?: string;
    scholarshipInfo?: string;
  };
  gallery?: string[]; // Image URLs
  testimonials?: {
    name: string;
    role: string;
    content: string;
    imageUrl?: string;
  }[];
  partnershipTier?: 'basic' | 'premium' | 'enterprise';
  revenueShare?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  category?: string;
  featured?: boolean;
  rating?: number;
  reviewsCount?: number;
  stock?: number;
  createdAt?: Timestamp;
  tags?: string[];
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
  unreadCount?: {
    [uid: string]: number;
  };
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
