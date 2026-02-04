
import type { User, Course, Transaction, Chapter, Lesson, Reward, TalentEntry, Notification, Partner, PartnerCourse, PartnerProduct, Contest } from './types';

// This file contains mock data. As the app is connected to Firebase,
// this data is used for initial structure, examples, and as a fallback.

export const mockPartners: Partner[] = [
  {
    id: 'acme-academy',
    name: 'Acme Academy',
    tagline: 'Excellence in Online Education',
    logoUrl: 'https://picsum.photos/seed/p1-logo/200/200',
    bannerUrl: 'https://picsum.photos/seed/p1-banner/1200/400',
    websiteUrl: 'https://example.com',
    contactEmail: 'contact@acme.com',
    description: 'Acme Academy is a leading provider of online courses, specializing in technology and business. Our mission is to empower students with the skills they need to succeed in the modern workplace.',
    stats: {
      studentsTaught: 15000,
      coursesOffered: 45,
      expertTutors: 25,
    },
  },
  {
    id: 'creative-minds',
    name: 'Creative Minds',
    tagline: 'Unleash Your Inner Artist',
    logoUrl: 'https://picsum.photos/seed/p2-logo/200/200',
    bannerUrl: 'https://picsum.photos/seed/p2-banner/1200/400',
    websiteUrl: 'https://example.com',
    contactEmail: 'hello@creativeminds.com',
    description: 'Creative Minds offers a wide range of courses in art, design, and music. Whether you\'re a beginner or a seasoned pro, our expert instructors will help you take your skills to the next level.',
    stats: {
      studentsTaught: 8000,
      coursesOffered: 30,
      expertTutors: 15,
    },
  },
];

export const mockPartnerCourses: PartnerCourse[] = [
    { id: 'pcourse_1', title: 'Advanced Web Development', category: 'Technology', enrolled: 2500, imageUrl: 'https://picsum.photos/seed/pc1/400/225', partnerId: 'acme-academy' },
    { id: 'pcourse_2', title: 'Digital Marketing Masterclass', category: 'Business', enrolled: 1800, imageUrl: 'https://picsum.photos/seed/pc2/400/225', partnerId: 'acme-academy' },
    { id: 'pcourse_3', title: 'Introduction to Graphic Design', category: 'Art & Design', enrolled: 3200, imageUrl: 'https://picsum.photos/seed/pc3/400/225', partnerId: 'creative-minds' },
    { id: 'pcourse_4', title: 'Music Theory for Beginners', category: 'Music', enrolled: 1500, imageUrl: 'https://picsum.photos/seed/pc4/400/225', partnerId: 'creative-minds' },
];

export const mockPartnerProducts: PartnerProduct[] = [
    { id: 'prod_1', title: 'Web Dev Ebook Bundle', description: 'All our web development ebooks in one package.', imageUrl: 'https://picsum.photos/seed/pp1/400/225', priceInRupees: 999, priceInCoins: 10000, partnerId: 'acme-academy'},
    { id: 'prod_2', title: '1-on-1 Mentorship Session', description: 'A one-hour session with a senior developer.', imageUrl: 'https://picsum.photos/seed/pp2/400/225', priceInRupees: 5000, partnerId: 'acme-academy'},
    { id: 'prod_3', title: 'Digital Art Brush Pack', description: 'Over 100 custom brushes for your art projects.', imageUrl: 'https://picsum.photos/seed/pp3/400/225', priceInCoins: 2500, partnerId: 'creative-minds'},
];

export const mockPartnerContests: Contest[] = [
    { id: 'contest_1', title: 'Acme Coding Challenge', description: 'Showcase your coding skills and win big.', entryFee: 100, prize: 5000, status: 'live', startDate: new Date().toISOString(), endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), participantCount: 150, partnerId: 'acme-academy', imageUrl: 'https://picsum.photos/seed/pct1/600/400' },
    { id: 'contest_2', title: 'Creative Minds Designathon', description: 'A 24-hour design marathon.', entryFee: 50, prize: 2500, status: 'upcoming', startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(), participantCount: 0, partnerId: 'creative-minds', imageUrl: 'https://picsum.photos/seed/pct2/600/400' },
];


export const mockTalents: TalentEntry[] = [
  {
    id: 'talent_1',
    title: 'Acoustic Guitar Cover',
    description: 'My take on a classic rock song. Hope you enjoy it!',
    mediaUrl: 'https://picsum.photos/seed/401/600/800',
    mediaType: 'video',
    category: 'Music',
    author: {
      uid: 'user_musician_mia',
      name: 'MusicianMia',
      avatarUrl: 'https://picsum.photos/seed/111/100/100',
    },
    likes: 1200,
    comments: 85,
  },
  {
    id: 'talent_2',
    title: 'Abstract Oil Painting',
    description: 'The process of creating my latest digital artwork.',
    mediaUrl: 'https://picsum.photos/seed/402/600/800',
    mediaType: 'image',
    category: 'Art',
    author: {
      uid: 'user_painter_pete',
      name: 'PainterPete',
      avatarUrl: 'https://picsum.photos/seed/112/100/100',
    },
    likes: 856,
    comments: 42,
  },
  {
    id: 'talent_3',
    title: 'Hilarious Stand-up Bit',
    description: 'A short bit from my recent open mic night. Laughter is the best medicine!',
    mediaUrl: 'https://picsum.photos/seed/403/600/800',
    mediaType: 'video',
    category: 'Comedy',
    author: {
      uid: 'user_student_3',
      name: 'Chris Green',
      avatarUrl: 'https://picsum.photos/seed/104/100/100',
    },
    likes: 450,
    comments: 55,
  },
  {
    id: 'talent_4',
    title: 'The Vanishing Coin',
    description: 'A classic magic trick that will leave you baffled. Can you figure it out?',
    mediaUrl: 'https://picsum.photos/seed/404/600/800',
    mediaType: 'video',
    category: 'Magic',
    author: {
      uid: 'user_tutor_1',
      name: 'Dr. Evelyn Reed',
      avatarUrl: 'https://picsum.photos/seed/103/100/100',
    },
    likes: 980,
    comments: 120,
  },
  {
    id: 'talent_5',
    title: 'The Tortoise and the Hare',
    description: 'A classic fable told with handmade puppets.',
    mediaUrl: 'https://picsum.photos/seed/405/600/800',
    mediaType: 'video',
    category: 'Puppet Show',
    author: {
      uid: 'user_story_sam',
      name: 'Storytime Sam',
      avatarUrl: 'https://picsum.photos/seed/113/100/100',
    },
    likes: 630,
    comments: 33,
  },
    {
    id: 'talent_6',
    title: 'One-Man Show: The Office',
    description: 'Recreating a famous scene from The Office all by myself.',
    mediaUrl: 'https://picsum.photos/seed/406/600/800',
    mediaType: 'video',
    category: 'Mini Skits',
    author: {
      uid: 'user_skit_steve',
      name: 'Skit Steve',
      avatarUrl: 'https://picsum.photos/seed/114/100/100',
    },
    likes: 1500,
    comments: 201,
  },
];


export const mockUser: User = {
  id: 'user_12345',
  name: 'Alex Johnson',
  email: 'alex.j@example.com',
  bio: 'Lifelong learner & aspiring physicist. Exploring the universe one equation at a time.',
  avatarUrl: 'https://picsum.photos/seed/101/100/100',
  isSuperAdmin: false,
  followersCount: 150,
  followingCount: 100,
  createdAt: new Date().toISOString(),
  settings: {
    restrictChat: false,
    restrictSpending: false,
    restrictTalentHub: false
  },
  wallet: {
    knowledgeCoins: 100
  },
  knowledgePoints: 100,
  referralCode: 'ALEXJ123'
};

const algebraLessons: Lesson[] = [
    { id: 'l1', title: 'Variables and Expressions', order: 1, contentType: 'video', content: '...' },
    { id: 'l2', title: 'Solving Linear Equations', order: 2, contentType: 'text', content: '...' },
];

const physicsLessons: Lesson[] = [
    { id: 'l3', title: 'Newton\'s First Law', order: 1, contentType: 'video', content: '...' },
    { id: 'l4', title: 'Introduction to Forces', order: 2, contentType: 'pdf', content: '...' },
];

const algebraChapters: Chapter[] = [
    { id: 'c1', title: 'Introduction to Algebra', order: 1, description: 'Get started with the basic concepts.' },
    { id: 'c2', title: 'Advanced Topics', order: 2, description: 'Dive deeper into algebraic theories.' },
];

const physicsChapters: Chapter[] = [
    { id: 'c3', title: 'Classical Mechanics', order: 1, description: 'Understand the motion of objects.' },
];


export const courses: Course[] = [
  {
    id: 'course_math_101',
    title: 'Introduction to Algebra',
    description: 'Learn the fundamentals of algebraic expressions and equations.',
    instructorId: 'user_tutor_1',
    instructorName: 'Dr. Evelyn Reed',
    imageUrl: 'https://picsum.photos/seed/201/600/400',
    enrollmentCount: 1250,
    subject: 'Math',
    duration: '8 Weeks',
    knowledgeCoins: 100,
  },
  {
    id: 'course_sci_101',
    title: 'Basics of Physics',
    description: 'Explore the core concepts of motion, energy, and forces.',
    instructorId: 'user_tutor_1',
    instructorName: 'Dr. Evelyn Reed',
    imageUrl: 'https://picsum.photos/seed/202/600/400',
    enrollmentCount: 2300,
    subject: 'Science',
    duration: '10 Weeks',
    knowledgeCoins: 150,
  },
  {
    id: 'course_hist_101',
    title: 'World History: Ancient Civilizations',
    description: 'A journey through the great civilizations of the ancient world.',
    instructorId: 'user_tutor_2',
    instructorName: 'Dr. Marcus Cole',
    imageUrl: 'https://picsum.photos/seed/203/600/400',
    enrollmentCount: 1800,
    subject: 'History',
    duration: '12 Weeks',
    knowledgeCoins: 200,
  },
  {
    id: 'course_cs_101',
    title: 'Beginner Python',
    description: 'Start your journey into programming with Python.',
    instructorId: 'user_tutor_2',
    instructorName: 'Dr. Marcus Cole',
    imageUrl: 'https://picsum.photos/seed/204/600/400',
    enrollmentCount: 3100,
    subject: 'Creative Writing',
    duration: '6 Weeks',
    knowledgeCoins: 120,
  }
];

export const transactions: Transaction[] = [
  {
    id: 'txn_1',
    createdAt: new Date(),
    description: 'Completed "Algebra Basics" quiz',
    points: 10,
    transactionType: 'earn'
  },
  {
    id: 'txn_2',
    createdAt: new Date(),
    description: 'Redeemed for "Advanced Topic" access',
    points: 50,
    transactionType: 'spend'
  },
  {
    id: 'txn_3',
    createdAt: new Date(),
    description: 'Daily login bonus',
    points: 5,
    transactionType: 'earn'
  },
  {
    id: 'txn_4',
    createdAt: new Date(),
    description: 'Peer tutoring session',
    points: 25,
    transactionType: 'earn'
  },
];

export const mockRewards: Reward[] = [
    {
      id: 'reward_1',
      title: '50% Off Next Course',
      description: 'Get a 50% discount on any course enrollment.',
      type: 'Course Coupon',
      pointsRequired: 500,
      inventory: 100,
    },
    {
      id: 'reward_2',
      title: 'Exclusive "Scholar" Badge',
      description: 'A special badge to display on your profile.',
      type: 'Profile Badge',
      pointsRequired: 1000,
      inventory: 50,
    },
    {
      id: 'reward_3',
      title: 'eBook: The Art of Learning',
      description: 'A digital book packed with tips for effective studying.',
      type: 'eBook',
      pointsRequired: 250,
      inventory: 200,
    },
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'new_follower',
    actor: { name: 'MusicianMia', avatarUrl: 'https://picsum.photos/seed/111/100/100', uid: 'user_musician_mia' },
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
  },
  {
    id: 'notif_2',
    type: 'contest_win',
    actor: { name: 'GenZeerr Team', avatarUrl: '/logo.svg', uid: 'system' },
    data: { contestName: 'Weekly Science Quiz' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: 'notif_3',
    type: 'post_like',
    actor: { name: 'PainterPete', avatarUrl: 'https://picsum.photos/seed/112/100/100', uid: 'user_painter_pete' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
  {
    id: 'notif_4',
    type: 'course_enrollment',
    actor: { name: 'Dr. Evelyn Reed', avatarUrl: 'https://picsum.photos/seed/103/100/100', uid: 'user_tutor_1' },
    data: { courseName: 'Basics of Physics' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    read: true,
  },
];
