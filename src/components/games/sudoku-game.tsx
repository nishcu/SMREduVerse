'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generate, solve, board_string_to_grid } from 'sudoku';

const generatePuzzle = () => {
    const puzzleString = generate('easy');
    const puzzleGrid = board_string_to_grid(puzzleString);
    const solutionGrid = board_string_to_grid(solve(puzzleString));
    return puzzleGrid.map((row, r) =>
        row.map((cell, c) => ({
            value: cell === '.' ? null : parseInt(cell),
            isGiven: cell !== '.',
            isCorrect: true,
            solution: solutionGrid[r][c]
        }))
    );
};

export function SudokuGame() {
    const [board, setBoard] = useState(generatePuzzle());
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    
    const handleCellClick = (row: number, col: number) => {
        if (!board[row][col].isGiven) {
            setSelectedCell({ row, col });
        }
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell) return;
        
        const { row, col } = selectedCell;
        const newBoard = [...board];
        const cell = newBoard[row][col];
        
        cell.value = num;
        cell.isCorrect = num === cell.solution;
        setBoard(newBoard);

        checkCompletion(newBoard);
    };

    const checkCompletion = (currentBoard: typeof board) => {
        const isComplete = currentBoard.every(row => row.every(cell => cell.value !== null));
        const isAllCorrect = currentBoard.every(row => row.every(cell => cell.isCorrect));
        if (isComplete && isAllCorrect) {
            setIsFinished(true);
        }
    }
    
    const startNewGame = () => {
        setBoard(generatePuzzle());
        setSelectedCell(null);
        setIsFinished(false);
    }

    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <h2 className="text-3xl font-bold font-headline">Sudoku</h2>
            
            <div className="grid grid-cols-9 bg-muted rounded-lg border-4 border-primary overflow-hidden">
                {board.map((row, r) =>
                    row.map((cell, c) => (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => handleCellClick(r, c)}
                            className={cn(
                                "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xl font-bold cursor-pointer transition-colors",
                                cell.isGiven ? 'bg-secondary text-secondary-foreground' : 'hover:bg-primary/10',
                                selectedCell?.row === r && selectedCell?.col === c && 'bg-primary/20',
                                !cell.isCorrect && cell.value !== null && 'text-destructive',
                                (c === 2 || c === 5) && 'border-r-2 border-primary/50',
                                (r === 2 || r === 5) && 'border-b-2 border-primary/50',
                            )}
                        >
                            {cell.value}
                        </div>
                    ))
                )}
            </div>

            <div className="flex gap-2">
                {[...Array(9)].map((_, i) => (
                    <Button key={i} onClick={() => handleNumberInput(i + 1)} variant="outline" size="icon" className="w-10 h-10 text-lg">
                        {i + 1}
                    </Button>
                ))}
            </div>

            <Button onClick={startNewGame}>New Game</Button>
             
            {isFinished && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4">
                    <h2 className="text-3xl font-bold">You Won!</h2>
                    <p>You have successfully completed the puzzle.</p>
                    <Button onClick={startNewGame}>Play Again</Button>
                </div>
            )}
        </div>
    );
}
