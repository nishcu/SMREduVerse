import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { BookOpen, Code, FlaskConical, Globe, Landmark, Palette, Calculator, Music, Atom, Trees, Scale, PiggyBank, ChefHat, Gamepad2, Tv, Newspaper, Brain, PenTool } from 'lucide-react';

const allSubjects = [
  "Mathematics", "Science", "English", "History", "Geography", "Biology", 
  "Chemistry", "Physics", "Computer Science", "Art", "Music", "Mythology", 
  "Entertainment", "General Knowledge", "Current Affairs", 
  "Environmental Science", "Civics", "Economics", "Cooking", 
  "Games & Challenges", "Other"
];

const iconMap: { [key: string]: React.ComponentType<any> } = {
    'mathematics': Calculator,
    'science': FlaskConical,
    'english': PenTool,
    'history': Landmark,
    'geography': Globe,
    'biology': Atom,
    'chemistry': FlaskConical,
    'physics': Atom,
    'computer-science': Code,
    'art': Palette,
    'music': Music,
    'mythology': BookOpen,
    'entertainment': Tv,
    'general-knowledge': Brain,
    'current-affairs': Newspaper,
    'environmental-science': Trees,
    'civics': Scale,
    'economics': PiggyBank,
    'cooking': ChefHat,
    'games-&-challenges': Gamepad2,
    'other': BookOpen,
};

export default function SubjectsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <BookOpen className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            Explore Subjects
          </h1>
          <p className="text-muted-foreground">
            Browse topics and find content that interests you.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {allSubjects.map((subject) => {
          const subjectKey = subject.toLowerCase().replace(/\s+/g, '-');
          const Icon = iconMap[subjectKey] || BookOpen;
          return (
            <Link href={`/subjects/${subjectKey}`} key={subjectKey}>
              <Card className="group flex h-32 flex-col items-center justify-center gap-2 p-4 text-center transition-all hover:bg-primary/5 hover:shadow-lg">
                <Icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <p className="font-semibold text-foreground">{subject}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
