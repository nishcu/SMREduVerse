'use client';
import {
    BookOpen,
    Home,
    Users,
    Wallet,
    Bot,
    Settings,
    Briefcase,
    LayoutGrid,
    Heart,
    ShoppingBag,
    Gamepad2,
    Video,
    User as UserIcon,
    Map,
    School,
    Library,
    Trophy,
    Gift,
    Ticket,
    LifeBuoy,
    CreditCard,
    Handshake,
    MessageSquare,
    Coins,
    Shield,
    Target,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/user-nav';
import { useEffect, useState } from 'react';
import { NotificationDropdown } from '@/components/notification-dropdown';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/global-search';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { usePresence } from '@/lib/chat-presence';
import { MobileNumberPrompt } from '@/components/mobile-number-prompt';

const navItems = {
  'Home & Profile': [
    { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { href: '/profile/me', icon: Home, label: 'Profile' },
  ],
  'Social': [
    { href: '/social', icon: Users, label: 'Social Feed' },
    { href: '/discover', icon: Sparkles, label: 'Discover Users' },
    { href: '/chats', icon: MessageSquare, label: 'Chats' },
    { href: '/challenges', icon: Target, label: 'Challenges' },
    { href: '/contests', icon: Trophy, label: 'Contests'},
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard'},
  ],
  'Learning': [
    { href: '/my-classes', icon: School, label: 'My Classes' },
    { href: '/courses', icon: BookOpen, label: 'Courses' },
    { href: '/tutors/my-courses', icon: BookOpen, label: 'My Courses (Tutor)' },
    { href: '/ai-learning', icon: Sparkles, label: 'AI Learning Feed' },
    { href: '/subjects', icon: Library, label: 'Subjects' },
    { href: '/tutors', icon: UserIcon, label: 'Tutors' },
    { href: '/study-rooms', icon: Users, label: 'Study Rooms' },
  ],
  'Activities': [
    { href: '/games', icon: Gamepad2, label: 'Games' },
    { href: '/brain-lab', icon: Bot, label: 'Brain Lab' },
    { href: '/brain-quest', icon: Map, label: 'Brain Quest' },
    { href: '/talent-hub', icon: Video, label: 'Talent Hub' },
  ],
  'Economy': [
    { href: '/wallet', icon: Wallet, label: 'Wallet' },
    { href: '/marketplace', icon: Sparkles, label: 'Knowledge Marketplace' },
    { href: '/shops', icon: ShoppingBag, label: 'Shop' },
    { href: '/billing', icon: CreditCard, label: 'Billing'},
    { href: '/rewards', icon: Gift, label: 'Rewards'},
    { href: '/referrals', icon: Ticket, label: 'Referrals & Coupons' },
  ],
  'Platform': [
    { href: '/partners', icon: Handshake, label: 'Partners' },
  ]
};

const footerNavItems = [
    { href: '/support', icon: LifeBuoy, label: 'Support' },
    { href: '/settings', icon: Settings, label: 'Parental Controls' },
];

const adminNavItems = [
    { href: '/super-admin/users', icon: Shield, label: 'Admin Panel' }
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, firebaseUser, logout, loading } = useAuth();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  // Track user online status
  usePresence();

  useEffect(() => {
    // Mark that we've checked auth state at least once
    if (!loading) {
      setHasCheckedAuth(true);
    }
  }, [loading]);

  useEffect(() => {
    // Only redirect if:
    // 1. Auth state is fully determined (not loading)
    // 2. We've checked auth at least once (prevents redirect during initial mount/navigation)
    // 3. User is definitely not authenticated (no firebaseUser and no user)
    // 4. We're not already on the landing page
    // Don't redirect if we're on a protected route - wait for auth to load
    if (hasCheckedAuth && !loading && !firebaseUser && !user && pathname !== '/') {
      // Small delay to allow navigation to complete and auth to stabilize
      const timeoutId = setTimeout(() => {
        // Double-check auth state before redirecting
        if (!firebaseUser && !user) {
          router.push('/');
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [user, firebaseUser, loading, router, hasCheckedAuth, pathname]);

  // Show loading if auth is loading OR if firebaseUser exists but profile is still loading
  if (loading || (firebaseUser && !user)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // If no firebaseUser and no user after loading, redirect (handled by useEffect above)
  if (!firebaseUser && !user) {
    return null;
  }
  
  // Replace 'me' with actual user id
  navItems['Home & Profile'][1].href = `/profile/${user.id}`;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          {Object.entries(navItems).map(([group, items]) => {
            // Only show Parent section if user has children
            if (group === 'Parent' && (!user.children || user.children.length === 0)) {
              return null;
            }
            return (
              <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                          <SidebarMenuButton
                            isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href !== `/profile/${user.id}`)}
                            tooltip={item.label}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 {user.isSuperAdmin && adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton
                                isActive={pathname.startsWith(item.href)}
                                tooltip={item.label}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
                {footerNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href}>
                            <SidebarMenuButton
                                isActive={pathname.startsWith(item.href)}
                                tooltip={item.label}
                            >
                                <item.icon />
                                <span>{item.label}</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <MobileNumberPrompt />
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                Made in India with <Heart className="h-4 w-4 text-red-500 fill-current" />
            </div>
          </div>

          <div className="flex-1 max-w-lg">
             <GlobalSearch />
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:flex">
              <Link href="/billing">
                <Coins className="mr-2 h-4 w-4" />
                Buy Coins
              </Link>
            </Button>
            <NotificationDropdown />
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <FirebaseErrorListener />
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
