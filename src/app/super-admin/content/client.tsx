'use client';
import { useState } from 'react';
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
import { MoreHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { deletePostAction } from './actions';
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
import Link from 'next/link';

export function ContentManagementClient({ initialPosts }: { initialPosts: Post[] }) {
    const [posts, setPosts] = useState(initialPosts);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const handleDeleteAttempt = (id: string) => {
        setPostToDelete(id);
    };

    const handleDeleteConfirm = async () => {
        if (!postToDelete) return;
        const result = await deletePostAction(postToDelete);
        if (result.success) {
            setPosts(posts.filter(p => p.id !== postToDelete));
            toast({ title: 'Success', description: 'Post deleted successfully.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setPostToDelete(null);
    };

    const downloadCSV = () => {
        const headers = ['ID', 'Author ID', 'Author Name', 'Content', 'Likes', 'Comments', 'Created At'];
        const csvRows = [
            headers.join(','),
            ...posts.map(post => [
                post.id,
                post.author.uid,
                `"${post.author.name}"`,
                `"${post.content.replace(/"/g, '""')}"`, // Escape double quotes
                post.likes,
                post.comments,
                new Date(post.createdAt as unknown as string).toISOString()
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'posts.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={downloadCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Author</TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Posted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts.map(post => (
                            <TableRow key={post.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={post.author.avatarUrl} />
                                            <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                                        </Avatar>
                                        <p className="font-medium">{post.author.name}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-sm">
                                    <p className="truncate">{post.content}</p>
                                </TableCell>
                                <TableCell>
                                    {formatDistanceToNow(new Date(post.createdAt as unknown as string), { addSuffix: true })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/social`}>View Post</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteAttempt(post.id)} className="text-destructive">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
             <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will permanently delete the post. This action cannot be undone.
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
