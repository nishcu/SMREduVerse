'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { searchAction } from '@/app/(app)/actions';
import { Loader2, Search, Users, BookOpen, MessageSquare, Trophy, ShoppingBag, School, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

type SearchResults = {
    users: any[];
    courses: any[];
    posts: any[];
    challenges: any[];
    contests: any[];
    marketplace: any[];
    partners: any[];
    studyRooms: any[];
};

export function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const inputRef = useRef<HTMLInputElement>(null);

    // Close popover on navigation
    useEffect(() => {
        if(isOpen) {
            setIsOpen(false);
            setQuery('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const handleSearch = async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setResults(null);
            setLoading(false);
            setIsOpen(false);
            return;
        }
        setLoading(true);
        setIsOpen(true);
        const searchResults = await searchAction(searchQuery);
        setResults(searchResults);
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce(handleSearch, 300),
        []
    );

    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);
    
    const hasResults = results && (
        results.users.length > 0 || 
        results.courses.length > 0 || 
        results.posts.length > 0 ||
        results.challenges.length > 0 ||
        results.contests.length > 0 ||
        results.marketplace.length > 0 ||
        results.partners.length > 0 ||
        results.studyRooms.length > 0
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverAnchor asChild>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                            if (query.trim().length > 1 && hasResults) {
                                setIsOpen(true);
                            }
                        }}
                        placeholder="Search everything: users, courses, posts, challenges..."
                        className="pl-10"
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                </div>
            </PopoverAnchor>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="max-h-96 overflow-y-auto">
                    {hasResults ? (
                        <div className="space-y-2 p-2">
                           {results.users.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Users</h4>
                                   {results.users.map(user => (
                                       <motion.div key={user.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/profile/${user.id}`} className="block rounded-md p-2 hover:bg-secondary">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8"><AvatarImage src={user.avatarUrl} /><AvatarFallback>{getInitials(user.name)}</AvatarFallback></Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                                                    </div>
                                                </div>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                           {results.courses.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><BookOpen className="h-4 w-4" /> Courses</h4>
                                   {results.courses.map(course => (
                                       <motion.div key={course.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/courses/${course.id}`} className="block rounded-md p-2 hover:bg-secondary">
                                                <p className="text-sm font-medium">{course.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                            {results.posts.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Posts</h4>
                                   {results.posts.map(post => (
                                       <motion.div key={post.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/social`} className="block rounded-md p-2 hover:bg-secondary">
                                                <p className="text-sm font-medium truncate">{post.content || post.title}</p>
                                                <p className="text-xs text-muted-foreground">by {post.author?.name || 'Unknown'}</p>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                           {results.challenges.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" /> Challenges</h4>
                                   {results.challenges.map(challenge => (
                                       <motion.div key={challenge.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/challenges`} className="block rounded-md p-2 hover:bg-secondary">
                                                <p className="text-sm font-medium truncate">{challenge.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{challenge.description}</p>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                           {results.contests.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><Trophy className="h-4 w-4" /> Contests</h4>
                                   {results.contests.map(contest => (
                                       <motion.div key={contest.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/contests`} className="block rounded-md p-2 hover:bg-secondary">
                                                <p className="text-sm font-medium truncate">{contest.title}</p>
                                                <p className="text-xs text-muted-foreground truncate">{contest.description}</p>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                           {results.marketplace.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Marketplace</h4>
                                   {results.marketplace.map(item => (
                                       <motion.div key={item.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/marketplace`} className="block rounded-md p-2 hover:bg-secondary">
                                                <p className="text-sm font-medium truncate">{item.title}</p>
                                                <p className="text-xs text-muted-foreground">{item.price} coins</p>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                           {results.partners.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><School className="h-4 w-4" /> Partners</h4>
                                   {results.partners.map(partner => (
                                       <motion.div key={partner.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/partners/${partner.id}`} className="block rounded-md p-2 hover:bg-secondary">
                                                <p className="text-sm font-medium truncate">{partner.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{partner.type} • {partner.location}</p>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                           {results.studyRooms.length > 0 && (
                               <div>
                                   <h4 className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2"><Zap className="h-4 w-4" /> Study Rooms</h4>
                                   {results.studyRooms.map(room => (
                                       <motion.div key={room.id} whileHover={{ scale: 1.03, x: 5 }}>
                                           <Link href={`/study-rooms`} className="block rounded-md p-2 hover:bg-secondary">
                                                <p className="text-sm font-medium truncate">{room.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{room.subject || room.description}</p>
                                           </Link>
                                       </motion.div>
                                   ))}
                               </div>
                           )}
                        </div>
                    ) : (
                        query.length > 1 && !loading && <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: NodeJS.Timeout | null = null;

    const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };

    return debounced;
}
