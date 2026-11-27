import React from 'react';
import {
  Home,
  Dumbbell,
  Utensils,
  TrendingUp,
  Sparkles,
  User,
  Calculator,
  BookOpen,
  CalendarClock,
  HeartPulse,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Wifi,
  WifiOff,
  Flame,
} from 'lucide-react';
import { useAppStore, type PrimaryTab, type SubView } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

const PRIMARY_NAV: { id: PrimaryTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'workout', label: 'WORKOUT', icon: Dumbbell },
  { id: 'nutrition', label: 'NUTRITION', icon: Utensils },
  { id: 'progress', label: 'PROGRESS', icon: TrendingUp },
  { id: 'ai', label: 'AI ASSISTANT', icon: Sparkles },
];

const SECONDARY_NAV: { id: SubView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'calculators', label: 'Calculators', icon: Calculator },
  { id: 'library', label: 'Exercise Library', icon: BookOpen },
  { id: 'activity', label: 'Activity & Goals', icon: Flame },
  { id: 'recovery', label: 'Recovery', icon: HeartPulse },
  { id: 'planning', label: 'Future Planning', icon: CalendarClock },
  { id: 'settings', label: 'Backup & Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeTab, subView, sidebarCollapsed, isOnline, setActiveTab, setSubView, toggleSidebar } =
    useAppStore();

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-zinc-800/80 bg-[#0d0d10] transition-all duration-200 shrink-0',
          sidebarCollapsed ? 'w-[72px]' : 'w-60'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800/80">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-lime-400 text-zinc-950 font-black text-sm">
                G
              </div>
              <div>
                <span className="font-bold tracking-tight text-sm text-white block leading-none">GYM APP</span>
                <span className="text-[10px] text-zinc-500 font-medium">Fitness OS</span>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer mx-auto"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && subView === null;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id, null)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold tracking-wide transition-all cursor-pointer',
                    isActive
                      ? 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 border border-transparent'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-lime-400')} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>

          <div className="my-4 border-t border-zinc-800/80 pt-4 space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Modules
              </p>
            )}
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = subView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSubView(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-zinc-800/80 p-3">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-xs',
              isOnline ? 'bg-zinc-900 text-zinc-400' : 'bg-amber-500/10 text-amber-300'
            )}
          >
            {isOnline ? <Wifi className="h-3.5 w-3.5 text-lime-400 shrink-0" /> : <WifiOff className="h-3.5 w-3.5 shrink-0" />}
            {!sidebarCollapsed && <span>{isOnline ? 'Local DB Ready' : 'Offline Mode'}</span>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="flex md:hidden h-14 items-center justify-between border-b border-zinc-800/80 bg-[#0d0d10]/95 px-4 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-400 text-zinc-950 font-black text-xs">
              G
            </div>
            <span className="font-bold text-sm tracking-tight">GYM APP</span>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            )}
            <button
              onClick={() => setSubView('profile')}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSubView('settings')}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-zinc-800 bg-[#0d0d10]/95 px-2 py-1.5 backdrop-blur-md">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && subView === null;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id, null)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 min-w-[60px] transition-colors',
                  isActive ? 'text-lime-400' : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold tracking-tight">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
