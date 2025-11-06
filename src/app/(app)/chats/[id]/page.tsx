'use client';

import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Disable SSR for chat page to prevent hydration errors with Firestore data
const ChatPageContent = dynamic(
  () => import('./chat-page-content').then((mod) => ({ default: mod.ChatPageContent })),
  {
    ssr: false,
    loading: () => (
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex-grow p-4 space-y-4">
          <Skeleton className="h-12 w-3/5" />
          <Skeleton className="h-12 w-3/5 ml-auto" />
          <Skeleton className="h-12 w-2/5" />
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    ),
  }
);

export default function ChatPage() {
  return <ChatPageContent />;
}