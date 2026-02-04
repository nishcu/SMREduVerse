'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { TalentEntry } from '@/lib/data';

export function TalentCard({ talent }: { talent: TalentEntry }) {
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
  };
  
  return (
    <Card className="overflow-hidden group">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4]">
          <Image src={talent.mediaUrl} alt={talent.title} fill className="object-cover" />
           <Badge className="absolute right-2 top-2">{talent.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <CardTitle className="text-lg font-headline truncate group-hover:underline">{talent.title}</CardTitle>
        <CardDescription>by @{talent.author.name.replace(/\s+/g, '')}</CardDescription>
        
      </CardContent>
      <CardFooter className="flex justify-end gap-4 p-3 pt-0 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>{talent.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span>{talent.comments.toLocaleString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
