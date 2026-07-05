'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { LogOut, Settings, User, Search, Bell, MessageSquare, ChevronLeft, ChevronRight, Moon, Sun, MoreVertical, Plus, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { useMessagingStore } from '@/store/messagingStore';
import { useServerClock } from '@/hooks/useServerClock';
import { useAcademicStore } from '@/store/academicStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, PlusCircle } from 'lucide-react';
import { NameFormDialog } from '@/components/admin-views/modals/NameFormDialog';


interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  title: string;
}

export function DashboardLayout({ children, sidebarItems, title }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredNavItem, setHoveredNavItem] = useState<{ name: string; top: number } | null>(null);
  const { unreadTotal, fetchUnreadTotal } = useMessagingStore();
  const { batches, selectedBatchId, setSelectedBatchId, fetchBatches, addBatch, isLoading: isAcademicLoading } = useAcademicStore();
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load the Admin's batches once and default the selector to the first one.
  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    fetchBatches();
  }, [user?.role, fetchBatches]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && !selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id!);
    }
  }, [user?.role, selectedBatchId, batches, setSelectedBatchId]);

  // Poll for new-message/notification badge counts every 15s while the app is open.
  useEffect(() => {
    if (!user) return;
    fetchUnreadTotal();
    const interval = setInterval(fetchUnreadTotal, 15000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadTotal]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Compute role-based route prefix
  const rolePrefix = user?.role === 'SUPER_ADMIN' ? '/super-admin'
    : user?.role === 'ADMIN' ? '/admin'
    : '/student';

  const profileHref = `${rolePrefix}/profile`;
  const settingsHref = user?.role === 'STUDENT' ? '/student/notifications' : `${rolePrefix}/settings`;
  const notificationsHref = user?.role === 'STUDENT' ? '/student/notifications' : `${rolePrefix}/messages`;

  // Client-side auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (isMounted && !user) {
      router.replace('/login');
    }
  }, [user, router, isMounted]);

  const serverNow = useServerClock();

  if (!isMounted || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentDate = serverNow ? format(serverNow, 'EEEE, MMM d, yyyy') : '';
  const currentTime = serverNow ? format(serverNow, 'h:mm:ss a') : '';

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] z-20 shadow-sm relative"
      >
        {/* Collapse/expand toggle — floats at the vertical center of the sidebar's edge */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-30 h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 shadow-md hover:shadow-lg transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {/* Sidebar Header (Logo & Workspace) */}
        <div className="h-[72px] flex items-center px-4 border-b border-slate-200 dark:border-slate-800 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner shadow-blue-400">
              <span className="text-white font-bold text-lg leading-none">EA</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap"
                >
                  <h2 className="font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-tight">EA Platform</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admin Portal</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">

          {/* Navigation */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onMouseEnter={(e) => {
                    if (!isCollapsed) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredNavItem({ name: item.name, top: rect.top + rect.height / 2 });
                  }}
                  onMouseLeave={() => setHoveredNavItem(null)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 font-semibold shadow-[inset_4px_0_0_0_#2563EB]'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <item.icon className={`flex-shrink-0 h-[18px] w-[18px] ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} transition-colors`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-[14px] whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full justify-start border border-transparent text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:border-red-900/50 transition-all ${isCollapsed ? 'px-0 justify-center' : 'px-3'}`}
            title="Sign Out"
          >
            <LogOut className={`flex-shrink-0 h-[18px] w-[18px] ${!isCollapsed && 'mr-2'}`} />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Collapsed-sidebar hover tooltip — rendered fixed to the viewport (not inside the
          scrolling sidebar content) so it can never trigger a horizontal scrollbar there. */}
      <AnimatePresence>
        {isCollapsed && hoveredNavItem && (
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{ top: hoveredNavItem.top }}
            className="hidden md:block pointer-events-none fixed left-23 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium px-2.5 py-1.5 shadow-lg"
          >
            {hoveredNavItem.name}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-[72px] flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Hamburger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Menu className="h-6 w-6" />
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 flex flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800">
                  <div className="h-[72px] flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-inner shadow-blue-400">
                        <span className="text-white font-bold text-lg leading-none">EA</span>
                      </div>
                      <div>
                        <h2 className="font-bold text-[15px] text-slate-900 dark:text-slate-100 leading-tight">EA Platform</h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Portal</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <nav className="space-y-1">
                      {sidebarItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                              isActive 
                                ? 'text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 font-semibold' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <item.icon className="h-[18px] w-[18px]" />
                            <span className="text-[14px]">{item.name}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30">
                      <LogOut className="h-[18px] w-[18px] mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Welcome Message */}
            <div className="hidden md:flex items-center text-sm font-bold text-slate-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/50">
              Welcome back, {user?.name.split(' ')[0]}
            </div>

            {/* Batch selector — Admin only. Scopes the entire dashboard (Students, Exams, Exam Mapping, Reports). */}
            {user?.role === 'ADMIN' && (
              <div className="hidden md:flex items-center gap-1.5">
                {batches.length > 0 && (
                  <Select value={selectedBatchId ?? undefined} onValueChange={setSelectedBatchId}>
                    <SelectTrigger className="h-9 w-40 gap-2 rounded-full border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-medium">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="Select batch">
                        {(value: string | null) => batches.find((b) => b.id === value)?.name ?? 'Select batch'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((b) => (
                        <SelectItem key={b.id} value={b.id!}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setBatchDialogOpen(true)}
                  title="Create a new batch"
                  className="h-9 w-9 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
              <span>{currentDate}</span>
              <span className="h-3 w-px bg-slate-300 dark:bg-slate-700" />
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">{currentTime}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

            <Button variant="ghost" size="icon" onClick={() => router.push(`${rolePrefix}/messages`)} className="h-9 w-9 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative">
              <MessageSquare className="h-4 w-4" />
              {unreadTotal > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full border-2 border-white dark:border-[#0F172A]"></span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(notificationsHref)}
              className="h-9 w-9 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative"
            >
              <Bell className="h-4 w-4" />
              {unreadTotal > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0F172A]"></span>
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 ml-2 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-blue-500 pl-1 pr-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Avatar className="h-8 w-8 shadow-sm">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">{user.name}</span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase mt-0.5 tracking-wider">{user.role.replace('_', ' ')}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(profileHref)} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {user?.role !== 'STUDENT' && (
                  <DropdownMenuItem onClick={() => router.push(settingsHref)} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/30">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {user?.role === 'ADMIN' && (
        <NameFormDialog
          open={batchDialogOpen}
          onOpenChange={setBatchDialogOpen}
          title="Create Batch"
          description="A batch groups schools, departments, classes, and students under one academic intake (e.g., 2024-2028)."
          label="Batch Name"
          isLoading={isAcademicLoading}
          onSubmit={async (name) => {
            await addBatch(name);
            const created = useAcademicStore.getState().batches[0];
            if (created?.id) setSelectedBatchId(created.id);
          }}
        />
      )}
    </div>
  );
}
