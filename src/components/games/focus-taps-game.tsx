
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

export const FocusTapsGame = ({ onComplete }: { onComplete: () => void }) => {
    const [targets, setTargets] = useState<{ id: number; x: number; y: number }[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameStarted, setGameStarted] = useState(false);

    // Reset when component remounts (new key)
    useEffect(() => {
        setTargets([]);
        setScore(0);
        setTimeLeft(30);
        setGameStarted(false);
    }, []);

    useEffect(() => {
        if (!gameStarted || timeLeft === 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        const targetInterval = setInterval(() => {
            setTargets(prev => [
                ...prev,
                { id: Date.now(), x: Math.random() * 90, y: Math.random() * 90 }
            ]);
            // Remove old targets
            setTimeout(() => setTargets(prev => prev.slice(1)), 2000);
        }, 800);

        return () => {
            clearInterval(timer);
            clearInterval(targetInterval);
        };
    }, [gameStarted, timeLeft]);

    const handleTargetClick = (id: number) => {
        setTargets(prev => prev.filter(target => target.id !== id));
        setScore(prev => prev + 1);
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setTargets([]);
        setGameStarted(true);
    };
    
    const handleShare = () => {
        const shareText = `I scored ${score} in the Focus Taps game on EduVerse Architect! Can you beat my score?`;
        if (navigator.share) {
            navigator.share({
                title: 'New High Score!',
                text: shareText,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText);
            alert('Score copied to clipboard! Share it with your friends.');
        }
    };
    
    if (timeLeft === 0 && gameStarted) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-3xl font-bold">Game Over!</h2>
                <p className="text-xl">Your final score is: <span className="font-bold text-primary">{score}</span></p>
                <div className="flex gap-4">
                    <Button onClick={startGame}>Play Again</Button>
                    <Button onClick={onComplete} variant="secondary">Finish Session</Button>
                </div>
                <Button onClick={handleShare} variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" /> Share Score
                </Button>
            </div>
        )
    }

    if (!gameStarted) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-3xl font-bold">Focus Taps</h2>
                <p className="text-center text-muted-foreground max-w-md">Tap as many targets as you can before the time runs out. Ready to test your reaction speed?</p>
                <Button onClick={startGame}>Start Game</Button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b">
                <div className="text-lg">Time Left: <span className="font-bold text-primary">{timeLeft}s</span></div>
                <div className="text-lg">Score: <span className="font-bold text-primary">{score}</span></div>
            </div>
            <div className="relative flex-grow bg-muted rounded-lg overflow-hidden">
                {targets.map(target => (
                    <motion.div
                        key={target.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute w-12 h-12 bg-primary rounded-full cursor-pointer"
                        style={{ left: `${target.x}%`, top: `${target.y}%` }}
                        onPointerDown={() => handleTargetClick(target.id)}
                    />
                ))}
            </div>
        </div>
    );
};
