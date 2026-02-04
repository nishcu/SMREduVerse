'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ContestDialog } from './dialog';
import type { Contest } from '@/lib/types';
import { deleteContestAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';


export function ContestManagementClient({ initialContests }: { initialContests: Contest[] }) {
  const [contests, setContests] = useState<Contest[]>(initialContests);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreateNew = () => {
    setSelectedContest(null);
    setDialogOpen(true);
  };

  const handleEdit = (contest: Contest) => {
    setSelectedContest(contest);
    setDialogOpen(true);
  };
  
  const handleDeleteAttempt = (id: string) => {
    setContestToDelete(id);
    setAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contestToDelete) return;
    const result = await deleteContestAction(contestToDelete);
    if (result.success) {
      setContests(contests.filter((c) => c.id !== contestToDelete));
      toast({ title: 'Success', description: 'Contest deleted successfully.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setAlertOpen(false);
    setContestToDelete(null);
  };

  const onContestSaved = (savedContest: Contest) => {
     if (selectedContest) {
      setContests(contests.map((c) => (c.id === savedContest.id ? savedContest : c)));
    } else {
      setContests([savedContest, ...contests]);
    }
  }

   const downloadCSV = () => {
        const headers = ['ID', 'Title', 'Status', 'Start Date', 'End Date', 'Prize', 'Entry Fee', 'Participants'];
        const csvRows = [
            headers.join(','),
            ...contests.map(c => [
                c.id,
                `"${c.title}"`,
                c.status,
                format(new Date(c.startDate), 'yyyy-MM-dd'),
                format(new Date(c.endDate), 'yyyy-MM-dd'),
                c.prize,
                c.entryFee,
                c.participantCount,
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'contests.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
        </Button>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Contest
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Entry Fee</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contests.map((contest) => (
              <TableRow key={contest.id}>
                <TableCell className="font-medium">{contest.title}</TableCell>
                <TableCell><Badge variant={contest.status === 'live' ? 'destructive' : 'secondary'}>{contest.status}</Badge></TableCell>
                <TableCell>
                  {format(new Date(contest.startDate), 'PP')} - {format(new Date(contest.endDate), 'PP')}
                </TableCell>
                <TableCell>{contest.prize} Coins</TableCell>
                <TableCell>{contest.entryFee} Coins</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(contest)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteAttempt(contest.id)} className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ContestDialog
        isOpen={isDialogOpen}
        setOpen={setDialogOpen}
        contest={selectedContest}
        onContestSaved={onContestSaved}
      />
       <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
