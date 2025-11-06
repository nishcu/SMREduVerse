'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const words = [
    'react', 'javascript', 'tailwind', 'nextjs', 'firebase', 'genkit',
    'typescript', 'python', 'nodejs', 'mongodb', 'postgres', 'graphql',
    'docker', 'kubernetes', 'aws', 'azure', 'golang', 'rust', 'swift',
    'kotlin', 'flutter', 'angular', 'vuejs', 'svelte', 'express', 'django'
];
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const getRandomWord = () => {
    // Use timestamp for better randomization
    const seed = Date.now() % words.length;
    const randomIndex = (seed + Math.floor(Math.random() * words.length)) % words.length;
    return words[randomIndex];
};

export function HangmanGame() {
    const [word, setWord] = useState('');
    const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
    const [mistakes, setMistakes] = useState(0);

    const maxMistakes = 6;

    const maskedWord = word.split('').map(letter => (guessedLetters.includes(letter) ? letter : '_'));
    const isWinner = maskedWord.join('') === word && word !== '';
    const isLoser = mistakes >= maxMistakes;

    const handleGuess = (letter: string) => {
        if (guessedLetters.includes(letter) || isWinner || isLoser) return;
        setGuessedLetters([...guessedLetters, letter]);
        if (!word.includes(letter)) {
            setMistakes(mistakes + 1);
        }
    };
    
    const startNewGame = () => {
        setWord(getRandomWord());
        setGuessedLetters([]);
        setMistakes(0);
    }

    useEffect(() => {
        startNewGame();
        // Reset when component mounts (which happens with new key)
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            <div>
                <h2 className="text-3xl font-bold font-headline">Hangman</h2>
                <p className="text-muted-foreground">Can you guess the web dev term?</p>
            </div>
            
            {/* Hangman Figure */}
            <div className="text-lg font-mono text-muted-foreground">
                <pre>{`
   +---+
   |   |
   ${mistakes > 0 ? 'O' : ' '}   |
  ${mistakes > 2 ? '/' : ' '}${mistakes > 1 ? '|' : ' '}${mistakes > 3 ? '\\' : ' '}  |
  ${mistakes > 4 ? '/' : ' '} ${mistakes > 5 ? '\\' : ' '}  |
       |
=========`}</pre>
            </div>

            <p className="text-4xl font-bold tracking-widest font-mono">
                {maskedWord.join(' ')}
            </p>

            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {ALPHABET.map(letter => (
                    <Button
                        key={letter}
                        variant="outline"
                        size="icon"
                        onClick={() => handleGuess(letter)}
                        disabled={guessedLetters.includes(letter) || isWinner || isLoser}
                        className="w-10 h-10 text-lg"
                    >
                        {letter.toUpperCase()}
                    </Button>
                ))}
            </div>

            {(isWinner || isLoser) && (
                <div className="flex flex-col items-center gap-4">
                    <p className={`text-2xl font-bold ${isWinner ? 'text-green-500' : 'text-destructive'}`}>
                        {isWinner ? 'You Win!' : 'You Lost!'}
                    </p>
                    {!isWinner && <p>The word was: <span className="font-bold text-primary">{word}</span></p>}
                    <Button onClick={startNewGame}>Play Again</Button>
                </div>
            )}
        </div>
    );
}
