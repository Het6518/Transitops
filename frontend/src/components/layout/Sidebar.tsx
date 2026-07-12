import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bus,
  Route,
  Users,
  Navigation,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet,
  UserCog,
  Bus as BusIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { STORAGE_KEYS, ROUTES } from '@/lib/constants';
import { usePermissions } from '@/hooks/usePermissions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Fleet', href: ROUTES.FLEET, icon: Bus, permission: 'fleet:read' },
      { label: 'Routes', href: ROUTES.ROUTES_PAGE, icon: Route, permission: 'routes:read' },
      { label: 'Drivers', href: ROUTES.DRIVERS, icon: Users, permission: 'drivers:read' },
      { label: 'Trips', href: ROUTES.TRIPS, icon: Navigation, permission: 'trips:read' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Maintenance', href: ROUTES.MAINTENANCE, icon: Wrench, permission: 'maintenance:read' },
      { label: 'Fuel', href: ROUTES.FUEL, icon: Fuel, permission: 'fuel:read' },
      { label: 'Finance', href: ROUTES.FINANCE, icon: Wallet, permission: 'finance:read' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Reports', href: ROUTES.REPORTS, icon: BarChart3, permission: 'reports:read' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: ROUTES.USERS, icon: UserCog, permission: 'users:read' },
      { label: 'Settings', href: ROUTES.SETTINGS, icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, isMobile, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const canAccess = (permission?: string): boolean => {
    if (!permission || isSuperAdmin) return true;
    return hasPermission(permission);
  };

  const isActive = (href: string): boolean => {
    if (href === ROUTES.DASHBOARD) return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 shrink-0 px-4 border-b border-sidebar-border', collapsed && 'justify-center')}>
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shrink-0 shadow-glow-sm">
          <BusIcon className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-3 overflow-hidden whitespace-nowrap"
            >
              <span className="font-bold text-sidebar-foreground tracking-tight">TransitOps</span>
              <div className="text-[10px] text-sidebar-foreground/40 font-medium tracking-widest uppercase">
                Enterprise
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-5">
            {NAV_SECTIONS.map((section) => {
              const visibleItems = section.items.filter((item) => canAccess(item.permission));
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.title}>
                  {!collapsed && (
                    <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                      {section.title}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;

                      const navLink = (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          onClick={isMobile ? onMobileClose : undefined}
                          className={cn(
                            'sidebar-item',
                            active && 'sidebar-item-active',
                            collapsed && 'justify-center px-0 w-10 h-10 mx-auto',
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50')} />
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                          {!collapsed && item.badge && (
                            <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );

                      if (collapsed) {
                        return (
                          <li key={item.href} className="flex justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                              <TooltipContent side="right" className="font-medium">
                                {item.label}
                              </TooltipContent>
                            </Tooltip>
                          </li>
                        );
                      }

                      return <li key={item.href}>{navLink}</li>;
                    })}
                  </ul>
                  {!collapsed && <Separator className="mt-3 opacity-30" />}
                </div>
              );
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Collapse toggle */}
      {!isMobile && (
        <div className="shrink-0 p-2 border-t border-sidebar-border">
          <button
            onClick={onToggle}
            id="sidebar-toggle"
            className={cn(
              'w-full flex items-center justify-center h-8 rounded-lg text-sidebar-foreground/40',
              'hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150',
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
