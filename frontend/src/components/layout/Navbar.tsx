import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useThemeContext } from '@/app/providers/ThemeProvider';
import { getInitials, toTitleCase } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/fleet': 'Fleet Management',
  '/routes': 'Route Management',
  '/drivers': 'Driver Management',
  '/trips': 'Trip Management',
  '/maintenance': 'Maintenance',
  '/fuel': 'Fuel Management',
  '/finance': 'Finance',
  '/reports': 'Reports & Analytics',
  '/settings': 'Settings',
  '/users': 'User Management',
  '/profile': 'My Profile',
};

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { resolvedTheme, setTheme } = useThemeContext();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = PAGE_TITLES[location.pathname] ?? toTitleCase(location.pathname.slice(1));
  const userInitials = user ? getInitials(user.firstName, user.lastName) : 'U';

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 lg:px-6 gap-4 shrink-0">
      {/* Mobile menu button */}
      <Button
        id="mobile-menu-btn"
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground hidden sm:block">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex relative w-48 lg:w-64">
        <Input
          id="global-search"
          placeholder="Search..."
          className="pl-8 h-8 text-sm bg-muted/50 border-transparent focus:border-input"
          startIcon={<Search className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Notifications */}
      <Button
        id="notifications-btn"
        variant="ghost"
        size="icon-sm"
        className="relative"
      >
        <Bell className="h-4 w-4" />
        <Badge
          className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 text-[9px] flex items-center justify-center rounded-full"
          variant="destructive"
        >
          3
        </Badge>
      </Button>

      {/* Theme toggle */}
      <Button
        id="theme-toggle-btn"
        variant="ghost"
        size="icon-sm"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            id="user-menu-btn"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
          >
            <Avatar className="h-7 w-7">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user.firstName} />}
              <AvatarFallback name={`${user?.firstName} ${user?.lastName}`} className="text-[11px]">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-muted-foreground leading-tight capitalize">
                {user?.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem id="profile-link" onSelect={() => navigate(ROUTES.PROFILE)}>
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem id="settings-link" onSelect={() => navigate(ROUTES.SETTINGS)}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            id="logout-btn"
            destructive
            onSelect={() => logout()}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
