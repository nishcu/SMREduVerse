
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Share2 } from 'lucide-react';

type Operation = '+' | '-' | '*';

function generateQuestion(seed: number = Date.now()) {
    const operations: Operation[] = ['+', '-', '*'];
    // Use seed for better randomization
    const op = operations[Math.floor((seed % 1000) / 333.33) % operations.length];
    let num1 = (Math.floor(seed * 7) % 10) + 1;
    let num2 = (Math.floor(seed * 11) % 10) + 1;
    let answer: number;

    if (op === '-') {
        if (num1 < num2) [num1, num2] = [num2, num1];
    }
    if (op === '*') {
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * 5) + 1;
    }

    switch (op) {
        case '+': answer = num1 + num2; break;
        case '-': answer = num1 - num2; break;
        case '*': answer = num1 * num2; break;
    }

    const question = `${num1} ${op} ${num2}`;
    
    const options = new Set<number>();
    options.add(answer);
    while (options.size < 4) {
        const wrongAnswer = answer + Math.floor(Math.random() * 10) - 5;
        if (wrongAnswer !== answer) {
            options.add(wrongAnswer);
        }
    }

    return {
        question,
        answer,
        options: Array.from(options).sort(() => Math.random() - 0.5),
    };
}

export const MathQuizGame = ({ onComplete }: { onComplete: () => void }) => {
    const [score, setScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [gameSeed] = useState(() => Date.now()); // Generate seed once per game instance

    // Generate fresh questions each time game starts
    const questions = useMemo(() => 
        Array.from({ length: 10 }, (_, i) => generateQuestion(gameSeed + i * 1000)), 
        [gameSeed]
    );
    const totalQuestions = questions.length;
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / totalQuestions) * 100;

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (currentQuestionIndex < totalQuestions) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === 1) {
                        handleNextQuestion();
                        return 10;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [currentQuestionIndex, totalQuestions]);

    const handleAnswer = (option: number) => {
        setSelectedAnswer(option);
        if (option === currentQuestion.answer) {
            setScore(prev => prev + 10);
        }
        setTimeout(() => {
             handleNextQuestion();
        }, 500);
    };

    const handleNextQuestion = () => {
        setSelectedAnswer(null);
        setTimeLeft(10);
        setCurrentQuestionIndex(prev => prev + 1);
    }
    
    const handleShare = () => {
        const shareText = `I scored ${score} on the Math Quiz on EduVerse Architect! Think you can do better?`;
        if (navigator.share) {
            navigator.share({
                title: 'Math Quiz High Score!',
                text: shareText,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText);
            alert('Score copied to clipboard! Share it with your friends.');
        }
    };
    
    const restartGame = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setTimeLeft(10);
    };

    if (currentQuestionIndex >= totalQuestions) {
        return (
             <div className="flex flex-col items-center justify-center h-full gap-4">
                <h2 className="text-3xl font-bold">Quiz Complete!</h2>
                <p className="text-xl">Your final score is: <span className="font-bold text-primary">{score}</span></p>
                <div className="flex gap-4">
                    <Button onClick={restartGame}>Play Again</Button>
                    <Button onClick={onComplete} variant="secondary">Finish Session</Button>
                </div>
                 <Button onClick={handleShare} variant="outline" size="sm">
                    <Share2 className="mr-2 h-4 w-4" /> Share Score
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full items-center justify-center p-4 md:p-8">
            <Card className="w-full max-w-md">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <p>Question {currentQuestionIndex + 1}/{totalQuestions}</p>
                        <p>Score: {score}</p>
                    </div>
                    <Progress value={progress} className="mb-6"/>
                    <div className="relative flex justify-center items-center w-24 h-24 mx-auto mb-8 rounded-full border-4 border-primary">
                        <p className="text-3xl font-bold">{timeLeft}</p>
                    </div>

                    <div className="text-center text-4xl font-bold font-mono mb-8">
                        {currentQuestion.question} = ?
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {currentQuestion.options.map(option => {
                            const isCorrect = option === currentQuestion.answer;
                            const isSelected = selectedAnswer === option;
                            
                            let buttonClass = '';
                            if (isSelected) {
                                buttonClass = isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-destructive hover:bg-destructive/90';
                            } else if (selectedAnswer !== null && isCorrect) {
                                buttonClass = 'bg-green-500 hover:bg-green-600';
                            }

                            return (
                                <Button 
                                    key={option} 
                                    onClick={() => handleAnswer(option)}
                                    disabled={selectedAnswer !== null}
                                    className={`h-24 text-2xl ${buttonClass}`}
                                >
                                    {option}
                                </Button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
