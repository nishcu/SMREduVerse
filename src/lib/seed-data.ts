
'use server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { Quest } from '@/lib/types';

const quests: Omit<Quest, 'id'>[] = [
  {
    name: 'The Historian\'s Compass',
    subject: 'History',
    difficulty: 'Easy',
    icon: 'Compass',
    description: 'Navigate through the ancient worlds and uncover historical facts.'
  },
  {
    name: 'Galileo\'s Telescope',
    subject: 'Science',
    difficulty: 'Medium',
    icon: 'Orbit',
    description: 'Explore the cosmos, from tiny atoms to vast galaxies.'
  },
  {
    name: 'Euclid\'s Elements',
    subject: 'Mathematics',
    difficulty: 'Hard',
    icon: 'SquarePi',
    description: 'Solve complex geometric puzzles and logical proofs.'
  },
  {
    name: 'Magellan\'s Voyage',
    subject: 'Geography',
    difficulty: 'Easy',
    icon: 'Globe',
    description: 'Chart new territories and learn about the cultures of the world.'
  },
  {
    name: 'Shakespeare\'s Quill',
    subject: 'English',
    difficulty: 'Medium',
    icon: 'Feather',
    description: 'Dive into classic literature and analyze timeless stories.'
  }
];

export async function seedQuests() {
  const db = getAdminDb();

  const questsCollection = db.collection('quests');
  const batch = db.batch();

  const snapshot = await questsCollection.limit(1).get();
  if (!snapshot.empty) {
    console.log('Quests collection already has data. Seeding skipped.');
    return { success: true, message: 'Seeding skipped, data already exists.' };
  }

  quests.forEach((quest) => {
    const docRef = questsCollection.doc(); 
    batch.set(docRef, quest);
  });

  await batch.commit();
  console.log('Successfully seeded quests data.');
  return { success: true, message: 'Successfully seeded 5 quests.' };
}
