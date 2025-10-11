'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Move, Timer } from 'lucide-react';

const symbols = ['⚛️', '🚀', '⭐', '💡', '🌍', '🔬', '🧬', '📚'];
const createShuffledDeck = () => {
    const duplicatedSymbols = [...symbols, ...symbols];
    return duplicatedSymbols.sort(() => Math.random() - 0.5).map((symbol, index) => ({ id: index, symbol, isFlipped: false, isMatched: false }));
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
            setMoves(moves + 1);
            const [firstIndex, secondIndex] = flippedCards;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if (firstCard.symbol === secondCard.symbol) {
                setCards(prevCards =>
                    prevCards.map(card =>
                        card.symbol === firstCard.symbol ? { ...card, isMatched: true } : card
                    )
                );
                setFlippedCards([]);
            } else {
                setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map((card, index) =>
                            (index === firstIndex || index === secondIndex) ? { ...card, isFlipped: false } : card
                        )
                    );
                    setFlippedCards([]);
                }, 1000);
            }
        }
    }, [flippedCards, cards, moves]);

    const handleCardClick = (index: number) => {
        if (flippedCards.length < 2 && !cards[index].isFlipped) {
            setCards(prevCards =>
                prevCards.map((card, i) =>
                    i === index ? { ...card, isFlipped: true } : card
                )
            );
            setFlippedCards([...flippedCards, index]);
        }
    };
    
    const resetGame = () => {
        setCards(createShuffledDeck());
        setFlippedCards([]);
        setMoves(0);
        setGameOver(false);
    }

    return (
        <div className="flex flex-col h-full items-center justify-center relative">
             <div className="grid grid-cols-2 gap-4 absolute top-4 left-4 right-4">
                 <div className="flex items-center justify-center gap-2 rounded-md bg-background p-2">
                    <Move className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">{moves} Moves</span>
                </div>
                <div className="flex items-center justify-center gap-2 rounded-md bg-background p-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">{cards.filter(c => c.isMatched).length / 2} / {symbols.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 p-4">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        className="aspect-square rounded-lg cursor-pointer"
                        onClick={() => handleCardClick(index)}
                        animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <div className="absolute w-full h-full rounded-lg bg-primary flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                        </div>
                        <div className="absolute w-full h-full rounded-lg bg-secondary flex items-center justify-center text-4xl" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            {card.symbol}
                        </div>
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
