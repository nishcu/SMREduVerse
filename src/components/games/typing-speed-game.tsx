'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const paragraphs = [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet. Learning to type quickly and accurately is a valuable skill in today's digital world.",
    "Technology has revolutionized the way we live and work. From smartphones to artificial intelligence, innovation continues to shape our future. The possibilities are endless.",
    "The universe is vast and full of wonders. Stars, planets, and galaxies stretch across cosmic distances. Exploring space helps us understand our place in the cosmos.",
];

export function TypingSpeedGame() {
    const [text, setText] = useState('');
    const [typedText, setTypedText] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameStarted, setGameStarted] = useState(false);
    const [wpm, setWpm] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const resetGame = () => {
        setText(paragraphs[Math.floor(Math.random() * paragraphs.length)]);
        setTypedText('');
        setTimeLeft(60);
        setGameStarted(false);
        setWpm(0);
    }
    
    useEffect(() => {
        resetGame();
    }, []);

    useEffect(() => {
        if (gameStarted && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            const wordsTyped = typedText.trim().split(/\s+/).length;
            const minutes = 60 / 60; // 60 seconds
            setWpm(Math.round(wordsTyped / minutes));
        }
    }, [gameStarted, timeLeft, typedText]);

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
                    <p className="text-3xl font-bold">{timeLeft}</p>
                </Card>
                <Card className="text-center p-4">
                    <p className="text-sm text-muted-foreground">WPM</p>
                    <p className="text-3xl font-bold">{wpm}</p>
                </Card>
            </div>
            <Card className="w-full max-w-lg cursor-text" onClick={handleTextClick}>
                <CardContent className="p-6">
                    <p className="text-xl tracking-wider leading-relaxed">
                        {text.split('').map((char, index) => {
                            let color = 'text-muted-foreground';
                            if (index < typedText.length) {
                                color = char === typedText[index] ? 'text-primary' : 'text-destructive';
                            }
                            return <span key={index}>{char}</span>;
                        })}
                    </p>
                    <input ref={inputRef} type="text" className="opacity-0 absolute" value={typedText} onChange={handleInputChange} disabled={timeLeft === 0} />
                </CardContent>
            </Card>
            <Button onClick={resetGame} disabled={gameStarted && timeLeft > 0}>
                {timeLeft === 0 ? 'Play Again' : 'Reset'}
            </Button>
        </div>
    );
}
