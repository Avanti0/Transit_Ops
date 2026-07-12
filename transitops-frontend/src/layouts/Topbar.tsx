import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Badge } from '../components/ui/Badge';
import { toast } from 'sonner';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  'Fleet Manager': 'default',
  Driver: 'success',
  'Safety Officer': 'warning',
  'Financial Analyst': 'secondary',
};

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const navigate = useNavigate();

  const rawUser = localStorage.getItem('transitops_user');
  const user = rawUser
    ? (JSON.parse(rawUser) as { name: string; role: string; email: string })
    : null;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'TO';

  const roleVariant = user?.role ? (ROLE_VARIANT[user.role] ?? 'secondary') : 'secondary';

  const handleLogout = async () => {
    await authService.logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <div className="flex-1">
        {title && (
          <h1 className="text-lg font-semibold text-slate-800 truncate">{title}</h1>
        )}
      </div>

      {/* Right side: role badge + avatar + logout */}
      <div className="flex items-center gap-3">
        {/* Role badge — hidden on very small screens */}
        {user?.role && (
          <Badge variant={roleVariant} className="hidden sm:inline-flex">
            {user.role}
          </Badge>
        )}

        {/* Avatar with initials */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white select-none">
          {initials}
        </div>

        {/* User name — hidden on small screens */}
        {user?.name && (
          <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
            {user.name}
          </span>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
