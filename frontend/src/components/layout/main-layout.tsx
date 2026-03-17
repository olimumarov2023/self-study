import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  CalendarRange,
  Kanban,
  BarChart3,
  Settings,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { TimerWidget } from '@/components/timer/timer-widget';
import { useActiveSession } from '@/queries/use-time-tracking';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/backlog', label: 'Backlog', icon: Inbox },
  { to: '/planner', label: 'Planner', icon: CalendarRange },
  { to: '/board', label: 'Board', icon: Kanban },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function MainLayout() {
  // Restore active session on mount
  useActiveSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 px-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Self Study</span>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Separator />
        <div className="p-4 text-xs text-muted-foreground">
          Self Study App v0.1
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header bar with timer */}
        <header className="flex h-14 items-center justify-end border-b px-6">
          <TimerWidget />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
