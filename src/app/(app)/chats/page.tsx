
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ChatsPage() {
  return (
    <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center text-muted-foreground p-8">
            <MessageSquare className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold">Select a conversation</h2>
            <p>Choose a chat from the list on the left to start messaging.</p>
        </CardContent>
    </Card>
  );
}
