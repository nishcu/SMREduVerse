import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedChatList } from "@/components/chat/enhanced-chat-list";

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-6rem)]">
        <Card className="col-span-1 md:col-span-1 lg:col-span-1 h-full">
            <CardContent className="p-2 h-full">
                <EnhancedChatList />
            </CardContent>
        </Card>
        <div className="col-span-1 md:col-span-2 lg:col-span-3 h-full">
           {children}
        </div>
    </div>
  );
}
