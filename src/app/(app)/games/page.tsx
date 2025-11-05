'use client';

import { useState } from 'react';
import { Gamepad2, Brain, Puzzle, Type, Drama, Target, Shuffle, Grid } from 'lucide-react';
import { GameCard } from '@/components/game-card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MemoryMatchGame } from '@/components/games/memory-match-game';
import { TypingSpeedGame } from '@/components/games/typing-speed-game';
import { MathQuizGame } from '@/components/games/math-quiz-game';
import { HangmanGame } from '@/components/games/hangman-game';
import { FocusTapsGame } from '@/components/games/focus-taps-game';
import { WordShuffleGame } from '@/components/games/word-shuffle-game';
import { SudokuGame } from '@/components/games/sudoku-game';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const games = [
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Test your memory by matching pairs of cards.',
    icon: <Brain />,
    component: <MemoryMatchGame />,
  },
  {
    id: 'focus-taps',
    title: 'Focus Taps',
    description: 'Click the target as fast as you can to improve focus.',
    icon: <Target />,
    component: <FocusTapsGame onComplete={() => {}} />,
  },
  {
    id: 'word-shuffle',
    title: 'Word Shuffle',
    description: 'Unscramble the letters to find the hidden word.',
    icon: <Shuffle />,
    component: <WordShuffleGame />,
  },
  {
    id: 'math-quiz',
    title: 'Math Quiz',
    description: 'Solve math problems against the clock.',
    icon: <Puzzle />,
    component: <MathQuizGame onComplete={() => {}} />,
  },
  {
    id: 'typing-speed',
    title: 'Typing Speed Test',
    description: 'Test and improve your typing speed and accuracy.',
    icon: <Type />,
    component: <TypingSpeedGame />,
  },
   {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'A classic logic puzzle to challenge your brain.',
    icon: <Grid />,
    component: <SudokuGame />,
  },
  {
    id: 'hangman',
    title: 'Hangman',
    description: 'Guess the word before you run out of chances.',
    icon: <Drama />,
    component: <HangmanGame />,
  },
];

export type Game = (typeof games)[0];

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
            <Gamepad2 className="h-10 w-10 text-primary" />
            <div>
                <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                Games Arcade
                </h1>
                <p className="text-muted-foreground">
                Play games to sharpen your mind and earn Knowledge Coins.
                </p>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} onPlay={() => setSelectedGame(game)} />
          ))}
        </div>
      </div>
      <Sheet open={!!selectedGame} onOpenChange={(open) => !open && setSelectedGame(null)}>
        <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl">
          {selectedGame && (
            <ErrorBoundary onReset={() => setSelectedGame(null)}>
              <SheetHeader>
                <SheetTitle className="text-2xl font-headline">{selectedGame.title}</SheetTitle>
                <SheetDescription>{selectedGame.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 h-[calc(100vh-8rem)] rounded-lg bg-secondary p-4">
                {selectedGame.component}
              </div>
            </ErrorBoundary>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
