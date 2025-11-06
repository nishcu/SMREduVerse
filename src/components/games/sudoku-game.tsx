'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Simple Sudoku generator with proper puzzle generation
const generatePuzzle = (): Array<Array<{ value: number | null; isGiven: boolean; isCorrect: boolean; solution: number }>> => {
    try {
        // Use dynamic import for client-side
        if (typeof window !== 'undefined') {
            const sudoku = require('sudoku');
            const puzzleString = sudoku.generate('easy');
            const puzzleGrid = sudoku.board_string_to_grid(puzzleString);
            const solutionGrid = sudoku.board_string_to_grid(sudoku.solve(puzzleString));
            
            const puzzle = puzzleGrid.map((row: string[], r: number) =>
                row.map((cell: string, c: number) => ({
                    value: cell === '.' ? null : parseInt(cell),
                    isGiven: cell !== '.',
                    isCorrect: true,
                    solution: parseInt(solutionGrid[r][c])
                }))
            );
            
            // Verify puzzle has numbers
            const hasNumbers = puzzle.some(row => row.some(cell => cell.value !== null));
            if (hasNumbers) {
                return puzzle;
            }
        }
    } catch (error) {
        console.error('Sudoku generation error:', error);
    }
    
    // Fallback: Create a simple valid puzzle manually
    const fallbackPuzzle = [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9]
    ];
    
    const solution = [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ];
    
    return fallbackPuzzle.map((row, r) =>
        row.map((cell, c) => ({
            value: cell,
            isGiven: cell !== null,
            isCorrect: true,
            solution: solution[r][c]
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
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
            <h2 className="text-3xl font-bold font-headline">Sudoku</h2>
            
            <div className="grid grid-cols-9 bg-muted rounded-lg border-4 border-primary overflow-hidden w-full max-w-md">
                {board.map((row, r) =>
                    row.map((cell, c) => (
                        <div
                            key={`${r}-${c}`}
                            onClick={() => handleCellClick(r, c)}
                            className={cn(
                                "aspect-square w-full flex items-center justify-center text-lg sm:text-xl font-bold cursor-pointer transition-colors border border-border/50",
                                cell.isGiven ? 'bg-secondary text-secondary-foreground font-semibold' : 'bg-background hover:bg-primary/10',
                                selectedCell?.row === r && selectedCell?.col === c && 'bg-primary/20 ring-2 ring-primary',
                                !cell.isCorrect && cell.value !== null && 'text-destructive bg-destructive/10',
                                (c === 2 || c === 5) && 'border-r-4 border-primary/70',
                                (r === 2 || r === 5) && 'border-b-4 border-primary/70',
                            )}
                        >
                            {cell.value || ''}
                        </div>
                    ))
                )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {[...Array(9)].map((_, i) => (
                    <Button 
                        key={i} 
                        onClick={() => handleNumberInput(i + 1)} 
                        variant="outline" 
                        size="icon" 
                        className="w-10 h-10 sm:w-12 sm:h-12 text-lg font-bold"
                        disabled={!selectedCell}
                    >
                        {i + 1}
                    </Button>
                ))}
            </div>

            <div className="flex gap-2">
                <Button onClick={startNewGame} variant="outline">New Game</Button>
                {selectedCell && (
                    <Button 
                        onClick={() => {
                            if (selectedCell) {
                                const { row, col } = selectedCell;
                                const newBoard = [...board];
                                newBoard[row][col].value = null;
                                newBoard[row][col].isCorrect = true;
                                setBoard(newBoard);
                            }
                        }} 
                        variant="outline"
                    >
                        Clear
                    </Button>
                )}
            </div>
             
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
