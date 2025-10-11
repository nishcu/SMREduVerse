'use client';

import type { User } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function InstructorCard({ instructor }: { instructor: User }) {
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>About the Instructor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={instructor.avatarUrl} />
            <AvatarFallback>{getInitials(instructor.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{instructor.name}</h3>
            <p className="text-sm text-muted-foreground">@{instructor.name.replace(/\s+/g, '').toLowerCase()}</p>
          </div>
        </div>
        <CardDescription>{instructor.bio}</CardDescription>
        <Button asChild className="w-full">
          <Link href={`/profile/${instructor.id}`}>
            View Full Profile <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
