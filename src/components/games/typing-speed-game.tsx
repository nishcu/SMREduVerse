'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const paragraphs = [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet. Learning to type quickly and accurately is a valuable skill in today's digital world.",
    "Technology has revolutionized the way we live and work. From smartphones to artificial intelligence, innovation continues to shape our future. The possibilities are endless.",
    "The universe is vast and full of wonders. Stars, planets, and galaxies stretch across cosmic distances. Exploring space helps us understand our place in the cosmos.",
    "Programming is both an art and a science. It requires logical thinking, creativity, and attention to detail. Every line of code tells a story of problem-solving.",
    "Mathematics is the language of the universe. From counting apples to understanding quantum mechanics, numbers help us describe the world around us.",
    "Education opens doors to opportunities. Learning new skills and knowledge empowers us to achieve our dreams and make a positive impact on the world.",
];

const getRandomParagraph = () => {
    const seed = Date.now() % paragraphs.length;
    const randomIndex = (seed + Math.floor(Math.random() * paragraphs.length)) % paragraphs.length;
    return paragraphs[randomIndex];
};

export function TypingSpeedGame() {
    const [text, setText] = useState('');
    const [typedText, setTypedText] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameStarted, setGameStarted] = useState(false);
    const [wpm, setWpm] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const resetGame = () => {
        setText(getRandomParagraph());
        setTypedText('');
        setTimeLeft(60);
        setGameStarted(false);
        setWpm(0);
    }
    
    useEffect(() => {
        resetGame();
        // Reset when component mounts (which happens with new key)
    }, []);

    useEffect(() => {
        if (gameStarted && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Calculate WPM when time runs out
                        const wordsTyped = typedText.trim().split(/\s+/).filter(w => w.length > 0).length;
                        const minutes = 60 / 60; // 60 seconds = 1 minute
                        setWpm(Math.round(wordsTyped / minutes));
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameStarted, typedText]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!gameStarted) {
            setGameStarted(true);
        }
        setTypedText(e.target.value);
    };

    const handleTextClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }

    return (
        <div className="flex flex-col h-full items-center justify-center p-4 gap-6">
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                <Card className="text-center p-4">
                    <p className="text-sm text-muted-foreground">Time Left</p>
                    <p className="text-3xl font-bold">{timeLeft}s</p>
                </Card>
                <Card className="text-center p-4">
                    <p className="text-sm text-muted-foreground">WPM</p>
                    <p className="text-3xl font-bold">{wpm}</p>
                </Card>
            </div>
            
            <Card className="w-full max-w-lg cursor-text" onClick={handleTextClick}>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                        {!gameStarted ? 'Click below and start typing to begin!' : 'Type the text below:'}
                    </p>
                    <div className="min-h-[120px] max-h-[200px] p-4 bg-muted/50 rounded-lg border-2 border-dashed overflow-y-auto">
                        <p className="text-base sm:text-lg tracking-wider leading-relaxed select-none break-words whitespace-pre-wrap">
                            {text.split('').map((char, index) => {
                                let className = 'text-muted-foreground';
                                if (index < typedText.length) {
                                    className = char === typedText[index] ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold bg-red-50';
                                } else if (index === typedText.length) {
                                    className = 'text-primary bg-primary/10 font-semibold underline'; // Current position
                                }
                                return <span key={index} className={className}>{char === ' ' ? '\u00A0' : char}</span>;
                            })}
                        </p>
                    </div>
                    <input 
                        ref={inputRef} 
                        type="text" 
                        className="mt-4 w-full p-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-lg" 
                        value={typedText} 
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            // Prevent backspace from going back in browser
                            if (e.key === 'Backspace' && typedText.length === 0) {
                                e.preventDefault();
                            }
                        }}
                        disabled={timeLeft === 0}
                        placeholder="Start typing here..."
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Click anywhere in the text area or the input box to start typing
                    </p>
                </CardContent>
            </Card>
            
            <div className="flex gap-4">
                <Button onClick={resetGame} variant="outline">
                    {timeLeft === 0 ? 'Play Again' : gameStarted ? 'Reset Game' : 'Start New Game'}
                </Button>
                {gameStarted && timeLeft > 0 && (
                    <Button onClick={() => {
                        setGameStarted(false);
                        inputRef.current?.blur();
                    }} variant="secondary">
                        Pause
                    </Button>
                )}
            </div>
        </div>
    );
}
