
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function FollowersPage() {
  return (
    <Card>
      <CardContent className="py-16 text-center text-muted-foreground">
        <Users className="mx-auto h-12 w-12" />
        <h3 className="mt-4 text-xl font-semibold">Followers List</h3>
        <p>This user's followers will be displayed here soon.</p>
      </CardContent>
    </Card>
  );
}
