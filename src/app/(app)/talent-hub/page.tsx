
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film, PlusCircle } from 'lucide-react';
import { mockTalents, type TalentEntry } from '@/lib/data';
import { TalentCard } from '@/components/talent-card';
import { ShareTalentDialog } from '@/components/share-talent-dialog';
import { VideoPlayerDialog } from '@/components/video-player-dialog';

const categories = ['All', 'Music', 'Art', 'Performance', 'Mini Skits', 'Puppet Show', 'Story Telling', 'Magic', 'Comedy'];

export default function TalentHubPage() {
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<TalentEntry | null>(null);
  const [playlist, setPlaylist] = useState<TalentEntry[]>([]);
  const [currentCategory, setCurrentCategory] = useState('All');

  const handleOpenVideo = (video: TalentEntry, category: string) => {
    const currentPlaylist = category === 'All' ? mockTalents : mockTalents.filter(t => t.category === category);
    setPlaylist(currentPlaylist);
    setActiveVideo(video);
  }

  const handleCloseVideo = () => {
    setActiveVideo(null);
    setPlaylist([]);
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Film className="h-10 w-10 text-primary" />
            <div>
              <h1 className="font-headline text-3xl font-semibold md:text-4xl">
                Talent & Entertainment
              </h1>
              <p className="text-muted-foreground">
                Showcase your creative talents and discover performances from others.
              </p>
            </div>
          </div>
          <Button onClick={() => setShareDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Share Your Talent
          </Button>
        </div>

        <Tabs defaultValue="All" className="w-full" onValueChange={setCurrentCategory}>
          <TabsList className="grid w-full grid-cols-3 sm:flex sm:w-auto sm:flex-wrap">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {mockTalents
                  .filter((talent) => category === 'All' || talent.category === category)
                  .map((talent) => (
                    <div key={talent.id} onClick={() => handleOpenVideo(talent, category)} className="cursor-pointer">
                        <TalentCard talent={talent} />
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <ShareTalentDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
      <VideoPlayerDialog
        video={activeVideo}
        playlist={playlist}
        onClose={handleCloseVideo}
        onNavigate={(newVideo) => setActiveVideo(newVideo)}
       />
    </>
  );
}
