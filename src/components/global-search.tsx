'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { searchAction } from '@/app/(app)/actions';
import { Loader2, Search, Users, BookOpen, MessageSquare, Trophy, ShoppingBag, School, Target, Zap, X } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

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
    const [isFocused, setIsFocused] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close popover on navigation
    useEffect(() => {
        if (isOpen) {
            setIsOpen(false);
            setQuery('');
            setResults(null);
        }
    }, [pathname]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const searchResults = await searchAction(searchQuery.trim());
            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            setResults(null);
        } finally {
            setLoading(false);
        }
    }, []); // Empty deps - searchAction is stable

    // Debounced search function
    const handleSearch = useCallback((searchQuery: string) => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // If query is too short, clear results
        if (searchQuery.trim().length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }

        // Set loading state immediately
        setLoading(true);

        // Debounce the actual search
        debounceTimerRef.current = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);
    }, [performSearch]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        
        // Open popover when typing
        if (value.trim().length >= 2) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
            setResults(null);
        }

        // Trigger search
        handleSearch(value);
    };

    // Handle input focus
    const handleFocus = () => {
        setIsFocused(true);
        if (query.trim().length >= 2 && results) {
            setIsOpen(true);
        } else if (query.trim().length >= 2) {
            setIsOpen(true);
            handleSearch(query);
        }
    };

    // Handle clear
    const handleClear = () => {
        setQuery('');
        setResults(null);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Handle result click
    const handleResultClick = () => {
        setIsOpen(false);
        setQuery('');
        setResults(null);
    };

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

    const totalResults = results ? (
        results.users.length + 
        results.courses.length + 
        results.posts.length +
        results.challenges.length +
        results.contests.length +
        results.marketplace.length +
        results.partners.length +
        results.studyRooms.length
    ) : 0;

    return (
        <div ref={containerRef} className="relative w-full">
            <Popover open={isOpen && (query.trim().length >= 2 || hasResults)} onOpenChange={setIsOpen}>
                <PopoverAnchor asChild>
                    <div className="relative">
                        <Search className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                            isFocused ? "text-primary" : "text-muted-foreground"
                        )} />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={() => {
                                // Delay to allow click on results
                                setTimeout(() => setIsFocused(false), 200);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsOpen(false);
                                    inputRef.current?.blur();
                                }
                            }}
                            placeholder="Search everything: users, courses, posts, challenges..."
                            className="pl-10 pr-10"
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                                onClick={handleClear}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                        {loading && !query && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </div>
                </PopoverAnchor>
                <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0 mt-2" 
                    align="start" 
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    sideOffset={4}
                >
                    <div className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                            </div>
                        ) : hasResults ? (
                            <div className="space-y-1 p-2">
                                {totalResults > 0 && (
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                                        Found {totalResults} {totalResults === 1 ? 'result' : 'results'}
                                    </div>
                                )}
                                <AnimatePresence>
                                    {results.users.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <Users className="h-3.5 w-3.5" /> Users
                                            </h4>
                                            {results.users.map(user => (
                                                <motion.div 
                                                    key={user.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/profile/${user.id}`} 
                                                        onClick={handleResultClick}
                                                        className="flex items-center gap-3 rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <Avatar className="h-9 w-9 flex-shrink-0">
                                                            <AvatarImage src={user.avatarUrl} />
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                                        </div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {results.courses.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <BookOpen className="h-3.5 w-3.5" /> Courses
                                            </h4>
                                            {results.courses.map(course => (
                                                <motion.div 
                                                    key={course.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/courses/${course.id}`} 
                                                        onClick={handleResultClick}
                                                        className="block rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <p className="text-sm font-medium truncate">{course.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {results.posts.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <MessageSquare className="h-3.5 w-3.5" /> Posts
                                            </h4>
                                            {results.posts.map(post => (
                                                <motion.div 
                                                    key={post.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/social`} 
                                                        onClick={handleResultClick}
                                                        className="block rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <p className="text-sm font-medium truncate">{post.content || post.title}</p>
                                                        <p className="text-xs text-muted-foreground">by {post.author?.name || 'Unknown'}</p>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {results.challenges.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <Target className="h-3.5 w-3.5" /> Challenges
                                            </h4>
                                            {results.challenges.map(challenge => (
                                                <motion.div 
                                                    key={challenge.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/challenges`} 
                                                        onClick={handleResultClick}
                                                        className="block rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <p className="text-sm font-medium truncate">{challenge.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{challenge.description}</p>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {results.contests.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <Trophy className="h-3.5 w-3.5" /> Contests
                                            </h4>
                                            {results.contests.map(contest => (
                                                <motion.div 
                                                    key={contest.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/contests`} 
                                                        onClick={handleResultClick}
                                                        className="block rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <p className="text-sm font-medium truncate">{contest.title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{contest.description}</p>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {results.marketplace.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <ShoppingBag className="h-3.5 w-3.5" /> Marketplace
                                            </h4>
                                            {results.marketplace.map(item => (
                                                <motion.div 
                                                    key={item.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/marketplace`} 
                                                        onClick={handleResultClick}
                                                        className="block rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <p className="text-sm font-medium truncate">{item.title}</p>
                                                        <p className="text-xs text-muted-foreground">{item.price} coins</p>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {results.partners.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <School className="h-3.5 w-3.5" /> Partners
                                            </h4>
                                            {results.partners.map(partner => (
                                                <motion.div 
                                                    key={partner.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/partners/${partner.id}`} 
                                                        onClick={handleResultClick}
                                                        className="block rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <p className="text-sm font-medium truncate">{partner.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{partner.type} • {partner.location}</p>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                    {results.studyRooms.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <h4 className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 sticky top-0 bg-background z-10">
                                                <Zap className="h-3.5 w-3.5" /> Study Rooms
                                            </h4>
                                            {results.studyRooms.map(room => (
                                                <motion.div 
                                                    key={room.id} 
                                                    whileHover={{ scale: 1.01, x: 2 }}
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <Link 
                                                        href={`/study-rooms`} 
                                                        onClick={handleResultClick}
                                                        className="block rounded-md p-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <p className="text-sm font-medium truncate">{room.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{room.subject || room.description}</p>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : query.trim().length >= 2 && !loading ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">No results found</p>
                                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                            </div>
                        ) : query.trim().length === 1 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                <p className="text-sm text-muted-foreground">Type at least 2 characters to search</p>
                            </div>
                        ) : null}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
