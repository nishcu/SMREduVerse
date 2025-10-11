'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Game } from "@/app/(app)/games/page";

interface GameCardProps {
    game: Game;
    onPlay: () => void;
}

export function GameCard({ game, onPlay }: GameCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {game.icon}
            </div>
            <CardTitle className="font-headline text-2xl">{game.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription>{game.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button onClick={onPlay} className="w-full">
          Play Now <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
