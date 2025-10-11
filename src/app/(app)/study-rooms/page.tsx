
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, PlusCircle, Radio } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StudyRoom } from '@/lib/types';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function RoomCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="relative h-40 w-full overflow-hidden rounded-lg">
          <Skeleton className="h-full w-full" />
        </div>
        <Skeleton className="h-6 w-3/4 pt-4" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

function RoomCard({ room }: { room: StudyRoom }) {
  const isLive = room.status === 'live';
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="relative h-40 w-full overflow-hidden rounded-lg">
          <Image
            src={room.imageUrl}
            alt={room.name}
            fill
            className="object-cover"
          />
          {isLive && (
            <div className="absolute left-2 top-2 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
              <Radio className="h-4 w-4 animate-pulse" />
              LIVE
            </div>
          )}
        </div>
        <CardTitle className="pt-4 font-headline">{room.name}</CardTitle>
        <CardDescription>{room.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground">
          <p>
            Host: <span className="font-medium text-foreground">{room.hostName}</span>
          </p>
          <p>
            Subject: <Badge variant="secondary">{room.subject}</Badge>
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/study-rooms/${room.id}`}>
            {isLive ? 'Enter Room' : 'View Details'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function StudyRoomsPage() {
  const roomsQuery = useMemo(
    () => query(collection(db, 'study-rooms'), orderBy('createdAt', 'desc')),
    []
  );
  const { data: rooms, loading, error } = useCollection<StudyRoom>(roomsQuery);

  const liveRooms = rooms?.filter((r) => r.status === 'live');
  const upcomingRooms = rooms?.filter((r) => r.status === 'upcoming');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Users className="h-10 w-10 text-primary" />
          <div>
            <h1 className="font-headline text-3xl font-semibold md:text-4xl">
              Study Rooms
            </h1>
            <p className="text-muted-foreground">
              Collaborate with peers in real-time.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/study-rooms/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Room
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-destructive">Error loading study rooms: {error.message}</p>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 font-headline text-2xl font-semibold">
              Live Now
            </h2>
            {liveRooms && liveRooms.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {liveRooms.map((room) => (
                  <motion.div key={room.id} variants={itemVariants}>
                    <RoomCard room={room} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-muted-foreground">
                No study rooms are live right now.
              </p>
            )}
          </div>
          <div>
            <h2 className="mb-4 font-headline text-2xl font-semibold">
              Upcoming
            </h2>
            {upcomingRooms && upcomingRooms.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {upcomingRooms.map((room) => (
                  <motion.div key={room.id} variants={itemVariants}>
                    <RoomCard room={room} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-muted-foreground">
                No upcoming study rooms scheduled.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
