import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bus,
  Users,
  MapPin,
  Wrench,
  Fuel,
  Receipt,
  BarChart3,
  TrendingUp,
  LogOut,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { authService } from '../services/authService';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Vehicles', to: '/vehicles', icon: Bus },
  { label: 'Drivers', to: '/drivers', icon: Users },
  { label: 'Trips', to: '/trips', icon: MapPin },
  { label: 'Maintenance', to: '/maintenance', icon: Wrench },
  { label: 'Fuel Logs', to: '/fuel', icon: Fuel },
  { label: 'Expenses', to: '/expenses', icon: Receipt },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  { label: 'Analytics', to: '/analytics', icon: TrendingUp },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();

  // Read current user from localStorage
  const rawUser = localStorage.getItem('transitops_user');
  const user = rawUser ? (JSON.parse(rawUser) as { name: string; role: string; email: string }) : null;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'TO';

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out',
          // On desktop: always visible. On mobile: slide in/out.
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Bus className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">TransitOps</span>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                // Close drawer on mobile after navigation
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-slate-700/60 p-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
              {initials}
            </div>
            {/* Name + role */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name ?? 'User'}</p>
              <p className="truncate text-xs text-slate-400">{user?.role ?? ''}</p>
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
