'use client';

import { use } from 'react';
import { ChatPageContent } from './chat-page-content';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  use(params); // unwrap for Next.js 15 so params is not enumerated
  return <ChatPageContent />;
}