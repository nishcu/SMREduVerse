
'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';
import { getOrCreateChatAction } from '@/app/(app)/chats/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserIcon, MessageSquare, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { EditProfileDialog } from './edit-profile-dialog';

export function ProfileHeader({ user: profileUser }: { user: User }) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setEditOpen] = useState(false);

  const isOwnProfile = currentUser?.id === profileUser.id;
  const pathParts = pathname.split('/');
  const currentTab = pathParts.length > 3 && !['followers', 'following'].includes(pathParts[3]) ? pathParts[3] : 'posts';


  const handleFollow = () => {
    toast({ title: 'Followed!', description: `You are now following ${profileUser.name}.` });
  };

  const handleStartChat = () => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not signed in', description: 'You must be logged in to start a chat.' });
      return;
    }
    startTransition(async () => {
      const result = await getOrCreateChatAction(currentUser.id, profileUser.id);
      if (result.success && result.chatId) {
        router.push(`/chats/${result.chatId}`);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not start chat.' });
      }
    });
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <Avatar className="h-32 w-32 border-4 border-primary">
          <AvatarImage src={profileUser.avatarUrl} alt={profileUser.name} />
          <AvatarFallback className="text-4xl">
            {getInitials(profileUser.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="font-headline text-4xl font-bold">{profileUser.name}</h1>
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <motion.div whileHover={{ scale: 1.05 }}>
                    <Button onClick={() => setEditOpen(true)}>
                        <Edit className="mr-2" />
                        Edit Profile
                    </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button onClick={handleFollow}>
                        <UserIcon className="mr-2" />
                        Follow
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Button variant="outline" onClick={handleStartChat} disabled={isPending}>
                        <MessageSquare className="mr-2" />
                        {isPending ? 'Starting...' : 'Message'}
                    </Button>
                   </motion.div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href={`/profile/${profileUser.id}/followers`} className="hover:underline">
              <span className="font-bold text-foreground">{profileUser.followersCount}</span> Followers
            </Link>
            <Link href={`/profile/${profileUser.id}/following`} className="hover:underline">
              <span className="font-bold text-foreground">{profileUser.followingCount}</span> Following
            </Link>
             <span>
              <span className="font-bold text-foreground">{profileUser.knowledgePoints}</span> Knowledge Points
            </span>
          </div>
          <p className="text-muted-foreground">{profileUser.bio}</p>
        </div>
      </div>
      <Tabs value={currentTab} onValueChange={(value) => router.push(`/profile/${profileUser.id}/${value}`)} className="w-full">
        <TabsList>
            <motion.div whileHover={{ scale: 1.05, y: -2 }}>
                <TabsTrigger value={'posts'} asChild>
                    <Link href={`/profile/${profileUser.id}`}>Posts</Link>
                </TabsTrigger>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -2 }}>
                <TabsTrigger value="courses" asChild>
                    <Link href={`/profile/${profileUser.id}/courses`}>Courses</Link>
                </TabsTrigger>
            </motion.div>
             <motion.div whileHover={{ scale: 1.05, y: -2 }}>
                <TabsTrigger value="videos" asChild>
                    <Link href={`/profile/${profileUser.id}/videos`}>Videos</Link>
                </TabsTrigger>
            </motion.div>
        </TabsList>
      </Tabs>
    </div>
    {isOwnProfile && <EditProfileDialog isOpen={isEditOpen} onOpenChange={setEditOpen} user={profileUser} />}
    </>
  );
}
