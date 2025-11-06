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

type GameComponent = React.ComponentType<any>;

const games = [
  {
    id: 'memory-match',
    title: 'Memory Match',
    description: 'Test your memory by matching pairs of cards.',
    icon: <Brain />,
    component: MemoryMatchGame as GameComponent,
  },
  {
    id: 'focus-taps',
    title: 'Focus Taps',
    description: 'Click the target as fast as you can to improve focus.',
    icon: <Target />,
    component: FocusTapsGame as GameComponent,
    props: { onComplete: () => {} },
  },
  {
    id: 'word-shuffle',
    title: 'Word Shuffle',
    description: 'Unscramble the letters to find the hidden word.',
    icon: <Shuffle />,
    component: WordShuffleGame as GameComponent,
  },
  {
    id: 'math-quiz',
    title: 'Math Quiz',
    description: 'Solve math problems against the clock.',
    icon: <Puzzle />,
    component: MathQuizGame as GameComponent,
    props: { onComplete: () => {} },
  },
  {
    id: 'typing-speed',
    title: 'Typing Speed Test',
    description: 'Test and improve your typing speed and accuracy.',
    icon: <Type />,
    component: TypingSpeedGame as GameComponent,
  },
   {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'A classic logic puzzle to challenge your brain.',
    icon: <Grid />,
    component: SudokuGame as GameComponent,
  },
  {
    id: 'hangman',
    title: 'Hangman',
    description: 'Guess the word before you run out of chances.',
    icon: <Drama />,
    component: HangmanGame as GameComponent,
  },
];

export type Game = (typeof games)[0];

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameKey, setGameKey] = useState(0); // Key to force remount

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
            <GameCard key={game.id} game={game} onPlay={() => {
              setSelectedGame(game);
              setGameKey(prev => prev + 1); // Force remount with new key
            }} />
          ))}
        </div>
      </div>
      <Sheet open={!!selectedGame} onOpenChange={(open) => {
        if (!open) {
          setSelectedGame(null);
          setGameKey(prev => prev + 1); // Reset key when closing
        }
      }}>
        <SheetContent className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto">
          {selectedGame && (
            <ErrorBoundary onReset={() => {
              setSelectedGame(null);
              setGameKey(prev => prev + 1);
            }}>
              <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
                <SheetTitle className="text-2xl font-headline">{selectedGame.title}</SheetTitle>
                <SheetDescription>{selectedGame.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 min-h-[calc(100vh-12rem)] rounded-lg bg-secondary p-4 overflow-y-auto">
                <selectedGame.component key={`${selectedGame.id}-${gameKey}`} {...(selectedGame.props || {})} />
              </div>
            </ErrorBoundary>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
