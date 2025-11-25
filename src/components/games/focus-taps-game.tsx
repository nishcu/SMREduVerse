
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

export const FocusTapsGame = ({ onComplete }: { onComplete: () => void }) => {
    const [targets, setTargets] = useState<{ id: number; x: number; y: number }[]>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [gameStarted, setGameStarted] = useState(false);
    const targetTimeoutsRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

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
            setTargets(prev => {
                const nextTargets = [...prev];
                if (nextTargets.length >= 6) {
                    const removed = nextTargets.shift();
                    if (removed && targetTimeoutsRef.current[removed.id]) {
                        clearTimeout(targetTimeoutsRef.current[removed.id]);
                        delete targetTimeoutsRef.current[removed.id];
                    }
                }

                const id = Date.now();
                nextTargets.push({
                    id,
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 80 + 10
                });

                const timeoutId = setTimeout(() => {
                    setTargets(current => current.filter(target => target.id !== id));
                    delete targetTimeoutsRef.current[id];
                }, 1800);

                targetTimeoutsRef.current[id] = timeoutId;
                return nextTargets;
            });
        }, 600);

        return () => {
            clearInterval(timer);
            clearInterval(targetInterval);
            Object.values(targetTimeoutsRef.current).forEach(timeoutId => clearTimeout(timeoutId));
            targetTimeoutsRef.current = {};
        };
    }, [gameStarted, timeLeft]);

    const handleTargetClick = useCallback((id: number) => {
        setTargets(prev => prev.filter(target => target.id !== id));
        setScore(prev => prev + 1);
        if (targetTimeoutsRef.current[id]) {
            clearTimeout(targetTimeoutsRef.current[id]);
            delete targetTimeoutsRef.current[id];
        }
    }, []);

    const startGame = () => {
        Object.values(targetTimeoutsRef.current).forEach(timeoutId => clearTimeout(timeoutId));
        targetTimeoutsRef.current = {};
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
            <div className="relative flex-grow bg-muted rounded-lg overflow-hidden" style={{ touchAction: 'manipulation' }}>
                {targets.map(target => (
                    <motion.div
                        key={target.id}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="absolute w-14 h-14 bg-primary/90 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-transform z-10 flex items-center justify-center shadow-lg border border-white/40"
                        style={{ 
                            left: `${target.x}%`,
                            top: `${target.y}%`,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'auto'
                        }}
                        onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTargetClick(target.id);
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTargetClick(target.id);
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
