'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Move, Timer } from 'lucide-react';

const symbols = ['⚛️', '🚀', '⭐', '💡', '🌍', '🔬', '🧬', '📚', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎮'];
const createShuffledDeck = () => {
    // Use timestamp + random for better randomization
    const seed = Date.now() + Math.random();
    const selectedSymbols = [...symbols].sort(() => seed - Math.random()).slice(0, 8);
    const duplicatedSymbols = [...selectedSymbols, ...selectedSymbols];
    // Fisher-Yates shuffle with better randomization
    const shuffled = [...duplicatedSymbols];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor((seed + i) * Math.random()) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.map((symbol, index) => ({ 
        id: `${symbol}-${index}-${Date.now()}`, 
        symbol, 
        isFlipped: false, 
        isMatched: false 
    }));
};

export function MemoryMatchGame() {
    const [cards, setCards] = useState(createShuffledDeck());
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        if (cards.every(card => card.isMatched)) {
            setGameOver(true);
        }
    }, [cards]);
    
    useEffect(() => {
        if (flippedCards.length === 2) {
            setMoves(prevMoves => prevMoves + 1);
            const [firstIndex, secondIndex] = flippedCards;
            
            // Use setTimeout to check cards after state has updated
            setTimeout(() => {
                setCards(prevCards => {
                    const firstCard = prevCards[firstIndex];
                    const secondCard = prevCards[secondIndex];

                    if (firstCard.symbol === secondCard.symbol) {
                        // Match found - mark as matched and keep flipped
                        return prevCards.map((card, index) =>
                            (index === firstIndex || index === secondIndex) 
                                ? { ...card, isMatched: true, isFlipped: true } 
                                : card
                        );
                    } else {
                        // No match - flip back
                        return prevCards.map((card, index) =>
                            (index === firstIndex || index === secondIndex) 
                                ? { ...card, isFlipped: false } 
                                : card
                        );
                    }
                });
                setFlippedCards([]);
            }, 1000);
        }
    }, [flippedCards.length]); // Only depend on the length, not the array or cards

    const handleCardClick = (index: number) => {
        const card = cards[index];
        // Prevent clicking if card is already flipped, matched, or we're checking a match
        if (flippedCards.length >= 2 || card.isFlipped || card.isMatched) {
            return;
        }
        
        setCards(prevCards =>
            prevCards.map((c, i) =>
                i === index ? { ...c, isFlipped: true } : c
            )
        );
        setFlippedCards(prev => [...prev, index]);
    };
    
    const resetGame = () => {
        setCards(createShuffledDeck());
        setFlippedCards([]);
        setMoves(0);
        setGameOver(false);
    }

    return (
        <div className="flex flex-col h-full items-center justify-center relative p-4">
             <div className="grid grid-cols-2 gap-4 absolute top-4 left-4 right-4 z-10">
                 <div className="flex items-center justify-center gap-2 rounded-md bg-background p-2 shadow-md">
                    <Move className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">{moves} Moves</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-md bg-background p-2 shadow-md">
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">{cards.filter(c => c.isMatched).length / 2} / {symbols.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-4 p-4 mt-20 max-w-lg w-full">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        className="aspect-square rounded-xl cursor-pointer relative"
                        style={{ minWidth: '60px', minHeight: '60px' }}
                        onClick={() => handleCardClick(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.div
                            className="w-full h-full rounded-xl relative shadow-lg"
                            style={{ transformStyle: 'preserve-3d' }}
                            animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        >
                            {/* Card back - shows question mark */}
                            <div 
                                className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center border-2 border-primary-foreground/30 shadow-inner"
                                style={{ 
                                    backfaceVisibility: 'hidden', 
                                    transform: 'rotateY(0deg)',
                                    WebkitBackfaceVisibility: 'hidden'
                                }}
                            >
                                <span className="text-4xl sm:text-5xl font-bold text-primary-foreground">?</span>
                            </div>
                            {/* Card front - shows symbol */}
                            <div 
                                className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center border-2 border-secondary-foreground/30 shadow-inner"
                                style={{ 
                                    backfaceVisibility: 'hidden', 
                                    transform: 'rotateY(180deg)',
                                    WebkitBackfaceVisibility: 'hidden'
                                }}
                            >
                                <span className="text-5xl sm:text-6xl">{card.symbol}</span>
                            </div>
                        </motion.div>
                    </motion.div>
                ))}
            </div>
            
            {gameOver && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
                    <h2 className="text-3xl font-bold">You Won!</h2>
                    <p>You completed the game in {moves} moves.</p>
                    <Button onClick={resetGame}>Play Again</Button>
                </div>
            )}
        </div>
    );
}
