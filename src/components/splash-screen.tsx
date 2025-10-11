'use client';

import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Trophy, Users, PlusCircle } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <BookOpen className="h-10 w-10 text-primary" />,
    title: 'Learn & Grow',
    description: 'Explore thousands of courses and track your progress.',
  },
  {
    icon: <Trophy className="h-10 w-10 text-amber-500" />,
    title: 'Compete & Earn',
    description: 'Join contests, play games, and earn Knowledge Coins.',
  },
  {
    icon: <Users className="h-10 w-10 text-blue-500" />,
    title: 'Collaborate & Connect',
    description: 'Join study rooms and connect with a community of learners.',
  },
  {
    icon: <PlusCircle className="h-10 w-10 text-green-500" />,
    title: 'Create & Share',
    description: 'Showcase your knowledge by creating courses and posts.',
  },
];

export function SplashScreen() {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full max-w-xs"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {features.map((feature, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
