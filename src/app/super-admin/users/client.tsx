'use client';
import { useState, useMemo, useTransition, useEffect } from 'react';
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
import { MoreHorizontal, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { format, formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/utils';
import { getUsersAction, updateUserAdminStatusAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function UserTableSkeleton() {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function UserManagementClient({ initialUsers: serverUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(serverUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(serverUsers.length === 0);

     useEffect(() => {
        const fetchUsers = async () => {
            const usersData = await getUsersAction();
            setUsers(usersData);
            setIsLoading(false);
        };
        if (serverUsers.length === 0) {
            fetchUsers();
        }
    }, [serverUsers]);

    const filteredUsers = useMemo(() =>
        users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [users, searchTerm]);

    const handleToggleAdmin = (user: User) => {
        startTransition(async () => {
            const newStatus = !user.isSuperAdmin;
            const result = await updateUserAdminStatusAction(user.id, newStatus);
            if (result.success) {
                setUsers(users.map(u => u.id === user.id ? { ...u, isSuperAdmin: newStatus } : u));
                toast({ title: 'Success', description: `${user.name}'s admin status has been updated.` });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };
    
    const downloadCSV = () => {
        const headers = ['ID', 'Name', 'Email', 'Role', 'Followers', 'Following', 'Joined At'];
        const csvRows = [
            headers.join(','),
            ...filteredUsers.map(user => [
                user.id,
                `"${user.name}"`,
                user.email,
                user.isSuperAdmin ? 'Super Admin' : 'User',
                user.followersCount,
                user.followingCount,
                format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm:ss')
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'users.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div>
            <div className="flex items-center justify-between py-4 gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="pl-10"
                    />
                </div>
                 <Button variant="outline" onClick={downloadCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                </Button>
            </div>
             {isLoading ? (
                <UserTableSkeleton />
             ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isSuperAdmin ? 'default' : 'secondary'}>
                                            {user.isSuperAdmin ? 'Super Admin' : 'User'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{format(new Date(user.createdAt), 'PP')}</span>
                                            <span className="text-xs text-muted-foreground">
                                                ({formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })})
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild><Link href={`/profile/${user.id}`}>View Profile</Link></DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleAdmin(user)} disabled={isPending}>
                                                    {user.isSuperAdmin ? 'Revoke Admin' : 'Make Admin'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
             )}
        </div>
    );
}
