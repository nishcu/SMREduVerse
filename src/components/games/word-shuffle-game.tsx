'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const words = ['react', 'nextjs', 'tailwind', 'firebase', 'genkit', 'typescript', 'component'];

const shuffleWord = (word: string) => {
    const a = word.split('');
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    // Ensure the shuffled word is not the same as the original
    if (a.join('') === word) {
        return shuffleWord(word);
    }
    return a.join('');
};

export function WordShuffleGame() {
    const [word, setWord] = useState('');
    const [shuffledWord, setShuffledWord] = useState('');
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState('');
    const [score, setScore] = useState(0);

    const startNewGame = () => {
        const newWord = words[Math.floor(Math.random() * words.length)];
        setWord(newWord);
        setShuffledWord(shuffleWord(newWord));
        setGuess('');
        setMessage('');
    };
    
    useEffect(() => {
        startNewGame();
    }, []);

    const handleGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (guess.toLowerCase() === word) {
            setMessage('Correct! Well done!');
            setScore(prev => prev + 1);
            setTimeout(() => {
                startNewGame();
            }, 1500);
        } else {
            setMessage('Not quite, try again!');
            setGuess('');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 text-center p-4">
            <div>
                <h2 className="text-3xl font-bold font-headline">Word Shuffle</h2>
                <p className="text-muted-foreground">Unscramble the letters to find the hidden word.</p>
                <p className="mt-2 text-lg">Score: <span className="font-bold text-primary">{score}</span></p>
            </div>
            
            <div className="text-5xl font-bold tracking-widest text-primary">
                {shuffledWord.toUpperCase()}
            </div>

            <form onSubmit={handleGuess} className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
                <Input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Your guess"
                    className="text-center text-lg h-12"
                    disabled={message.includes('Correct')}
                />
                <Button type="submit" className="h-12 w-full sm:w-auto" disabled={message.includes('Correct')}>
                    Guess
                </Button>
            </form>
            
            <AnimatePresence>
            {message && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-lg font-semibold ${
                        message.includes('Correct') ? 'text-green-500' : 'text-destructive'
                    }`}
                >
                    {message}
                </motion.p>
            )}
            </AnimatePresence>

            <Button variant="outline" onClick={startNewGame}>
                Skip / New Word
            </Button>
        </div>
    );
}
