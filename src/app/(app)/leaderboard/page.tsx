
import { Trophy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const mockLeaderboard = [
    { rank: 1, name: 'Alice', points: 15200, avatar: 'https://picsum.photos/seed/leader1/40/40' },
    { rank: 2, name: 'Bob', points: 14800, avatar: 'https://picsum.photos/seed/leader2/40/40' },
    { rank: 3, name: 'Charlie', points: 13500, avatar: 'https://picsum.photos/seed/leader3/40/40' },
    { rank: 4, name: 'Diana', points: 12100, avatar: 'https://picsum.photos/seed/leader4/40/40' },
    { rank: 5, name: 'Ethan', points: 11500, avatar: 'https://picsum.photos/seed/leader5/40/40' },
];


export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Trophy className="h-10 w-10 text-primary" />
        <div>
          <h1 className="font-headline text-3xl font-semibold md:text-4xl">
            Leaderboard
          </h1>
          <p className="text-muted-foreground">
            See who's at the top of the knowledge charts.
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Top Learners</CardTitle>
            <CardDescription>Overall rankings based on lifetime Knowledge Points.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[80px]">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockLeaderboard.map(user => (
                        <TableRow key={user.rank}>
                            <TableCell className="font-bold text-lg">{user.rank}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{user.points.toLocaleString()}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
