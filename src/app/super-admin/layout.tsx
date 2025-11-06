
'use client';
import {
    Users,
    BookOpen,
    Settings,
    Shield,
    Bot,
    Trophy,
    Handshake,
    LayoutDashboard,
    DollarSign,
    Target,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
import { UserNav } from '@/components/user-nav';

const navItems = [
    { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/super-admin/users', icon: Users, label: 'User Management' },
    { href: '/super-admin/courses', icon: BookOpen, label: 'Courses Management' },
    { href: '/super-admin/challenges', icon: Target, label: 'Challenges Management' },
    { href: '/super-admin/content', icon: BookOpen, label: 'Content Moderation' },
    { href: '/super-admin/contests', icon: Trophy, label: 'Contest Management' },
    { href: '/super-admin/partners', icon: Handshake, label: 'Partner Management' },
    { href: '/super-admin/reports', icon: TrendingUp, label: 'Transaction Reports' },
    { href: '/super-admin/monetization', icon: DollarSign, label: 'Monetization' },
    { href: '/super-admin/ai', icon: Bot, label: 'AI Configuration' },
    { href: '/super-admin/security-rules', icon: Shield, label: 'Security Rules' },
    { href: '/super-admin/settings', icon: Settings, label: 'Platform Settings' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }
  
  // Basic authorization check
  if (!user || !user.isSuperAdmin) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
                <Link href="/dashboard" className="mt-4 inline-block text-primary underline">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
                 <Link href="/dashboard">
                    <SidebarMenuButton tooltip="Back to App">
                        <LayoutDashboard />
                        <span>Back to App</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarSeparator />
            {navItems.map((item) => (
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
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:justify-end">
          <SidebarTrigger className="md:hidden" />
          <UserNav />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
