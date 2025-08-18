import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Calculator,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

interface NavigationItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permission?: string;
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    key: 'nav.dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    key: 'nav.inventory',
    icon: Package,
    href: '/inventory',
    permission: 'view_inventory',
  },
  {
    key: 'nav.customers',
    icon: Users,
    href: '/customers',
    permission: 'view_customers',
  },
  {
    key: 'nav.invoices',
    icon: FileText,
    href: '/invoices',
    permission: 'view_invoices',
  },
  {
    key: 'nav.accounting',
    icon: Calculator,
    href: '/accounting',
    permission: 'view_accounting',
  },
  {
    key: 'nav.reports',
    icon: BarChart3,
    href: '/reports',
    permission: 'view_reports',
  },
  {
    key: 'nav.sms',
    icon: MessageSquare,
    href: '/sms',
    permission: 'send_sms',
  },
  {
    key: 'nav.settings',
    icon: Settings,
    href: '/settings',
    permission: 'manage_settings',
    roles: ['Owner', 'Manager'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggle,
  className,
}) => {
  const { t, direction } = useLanguage();
  const { hasPermission, hasAnyRole } = useAuth();
  const location = useLocation();

  const isRTL = direction === 'rtl';

  // Filter navigation items based on permissions
  const visibleItems = navigationItems.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    if (item.roles && !hasAnyRole(item.roles)) {
      return false;
    }
    return true;
  });

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) {
      return true;
    }
    return location.pathname.startsWith(href) && href !== '/dashboard';
  };

  const ToggleIcon = isRTL ? 
    (isCollapsed ? ChevronLeft : ChevronRight) : 
    (isCollapsed ? ChevronRight : ChevronLeft);

  return (
    <div
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        isRTL && 'border-r-0 border-l',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
            <span className="font-semibold text-foreground truncate">
              {t('app.title')}
            </span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'h-8 w-8 p-0',
            isCollapsed && 'mx-auto'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ToggleIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isActive && 'bg-accent text-accent-foreground',
                isCollapsed ? 'justify-center' : 'justify-start space-x-3 rtl:space-x-reverse'
              )}
              title={isCollapsed ? t(item.key) : undefined}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0')} />
              {!isCollapsed && (
                <span className="truncate">{t(item.key)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            Gold Shop Management v1.0
          </div>
        </div>
      )}
    </div>
  );
};