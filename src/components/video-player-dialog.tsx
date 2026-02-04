
'use client';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import type { TalentEntry } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import Link from 'next/link';

interface VideoPlayerDialogProps {
  video: TalentEntry | null;
  playlist: TalentEntry[];
  onClose: () => void;
  onNavigate: (video: TalentEntry) => void;
}

export function VideoPlayerDialog({ video, playlist, onClose, onNavigate }: VideoPlayerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentIndex = playlist.findIndex(item => item.id === video?.id);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setProgress((videoElement.currentTime / videoElement.duration) * 100);
    };
    const handleDurationChange = () => {
        if (!isNaN(videoElement.duration)) {
            setDuration(videoElement.duration);
        }
    };
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    
    // Autoplay when the video source changes
    videoElement.play().catch(console.error);
    setIsPlaying(true);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
    };
  }, [video?.id]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const handleNext = () => {
    if (currentIndex < playlist.length - 1) {
      onNavigate(playlist[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(playlist[currentIndex - 1]);
    }
  };
  
  if (!video) return null;

  return (
    <Dialog open={!!video} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl p-0 border-0 bg-black">
        <div className="relative aspect-video group">
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Placeholder video
            className="w-full h-full"
            onClick={togglePlay}
            onEnded={handleNext}
            autoPlay
            playsInline
          />
          <div 
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-black/40 group-hover:opacity-100 opacity-0"
            onClick={togglePlay}
          >
            { !isPlaying && <Play className="w-20 h-20 text-white" fill="white" />}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100">
             {/* Progress Bar */}
            <Slider
                value={[progress]}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="w-full h-2 cursor-pointer"
            />
            {/* Controls */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-4 text-white">
                <Button variant="ghost" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
                    <SkipBack fill="white"/>
                </Button>
                <Button variant="ghost" size="icon" onClick={togglePlay}>
                  {isPlaying ? <Pause fill="white"/> : <Play fill="white"/>}
                </Button>
                 <Button variant="ghost" size="icon" onClick={handleNext} disabled={currentIndex >= playlist.length - 1}>
                    <SkipForward fill="white"/>
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleMute}>
                  {isMuted ? <VolumeX fill="white"/> : <Volume2 fill="white"/>}
                </Button>
              </div>
              <div className="text-white text-sm">
                <p>{video.title}</p>
                 <Link href={`/profile/${video.author.uid}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white" onClick={onClose}>
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={video.author.avatarUrl} />
                        <AvatarFallback>{getInitials(video.author.name)}</AvatarFallback>
                    </Avatar>
                    <span>{video.author.name}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
