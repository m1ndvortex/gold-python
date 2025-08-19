import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  ChevronUp,
  Gem,
  FolderOpen,
  Folder,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

interface NavigationSubItem {
  key: string;
  icon?: React.ComponentType<{ className?: string }>;
  href: string;
  permission?: string;
  roles?: string[];
  badge?: string;
}

interface NavigationItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permission?: string;
  roles?: string[];
  badge?: string;
  children?: NavigationSubItem[];
  expandable?: boolean;
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
    expandable: true,
    children: [
      {
        key: 'nav.inventory.products',
        icon: Gem,
        href: '/inventory/products',
        permission: 'view_inventory',
      },
      {
        key: 'nav.inventory.categories',
        icon: FolderOpen,
        href: '/inventory/categories',
        permission: 'view_inventory',
        badge: 'New',
      },
      {
        key: 'nav.inventory.bulk',
        icon: Plus,
        href: '/inventory/bulk',
        permission: 'edit_inventory',
      },
    ],
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
    expandable: true,
    children: [
      {
        key: 'nav.accounting.cash',
        href: '/accounting/cash-bank',
        permission: 'view_accounting',
      },
      {
        key: 'nav.accounting.income',
        href: '/accounting/income',
        permission: 'view_accounting',
      },
      {
        key: 'nav.accounting.expense',
        href: '/accounting/expense',
        permission: 'view_accounting',
      },
      {
        key: 'nav.accounting.gold',
        href: '/accounting/gold-weight',
        permission: 'view_accounting',
      },
      {
        key: 'nav.accounting.debt',
        href: '/accounting/debt',
        permission: 'view_accounting',
      },
    ],
  },
  {
    key: 'nav.reports',
    icon: BarChart3,
    href: '/reports',
    permission: 'view_reports',
    expandable: true,
    children: [
      {
        key: 'nav.reports.sales',
        icon: TrendingUp,
        href: '/reports/sales',
        permission: 'view_reports',
      },
      {
        key: 'nav.reports.inventory',
        icon: Package,
        href: '/reports/inventory',
        permission: 'view_reports',
      },
      {
        key: 'nav.reports.customers',
        icon: Users,
        href: '/reports/customers',
        permission: 'view_reports',
      },
    ],
  },
  {
    key: 'nav.sms',
    icon: MessageSquare,
    href: '/sms',
    permission: 'send_sms',
    expandable: true,
    children: [
      {
        key: 'nav.sms.campaigns',
        href: '/sms/campaigns',
        permission: 'send_sms',
      },
      {
        key: 'nav.sms.templates',
        href: '/sms/templates',
        permission: 'send_sms',
      },
      {
        key: 'nav.sms.history',
        href: '/sms/history',
        permission: 'send_sms',
      },
    ],
  },
  {
    key: 'nav.settings',
    icon: Settings,
    href: '/settings',
    permission: 'edit_settings',
    roles: ['Owner', 'Manager'],
    expandable: true,
    children: [
      {
        key: 'nav.settings.company',
        href: '/settings/company',
        permission: 'edit_settings',
        roles: ['Owner', 'Manager'],
      },
      {
        key: 'nav.settings.users',
        href: '/settings/users',
        permission: 'edit_settings',
        roles: ['Owner', 'Manager'],
      },
      {
        key: 'nav.settings.roles',
        href: '/settings/roles',
        permission: 'edit_settings',
        roles: ['Owner'],
      },
      {
        key: 'nav.settings.gold-price',
        href: '/settings/gold-price',
        permission: 'edit_settings',
        roles: ['Owner', 'Manager'],
      },
      {
        key: 'nav.settings.invoice-templates',
        href: '/settings/invoice-templates',
        permission: 'edit_settings',
        roles: ['Owner', 'Manager'],
      },
    ],
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const isParentActive = (item: NavigationItem) => {
    if (isActiveRoute(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActiveRoute(child.href));
    }
    return false;
  };

  const toggleExpanded = (itemKey: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  const ToggleIcon = isRTL ? 
    (isCollapsed ? ChevronLeft : ChevronRight) : 
    (isCollapsed ? ChevronRight : ChevronLeft);

  // Animation variants
  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4rem' }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const subItemVariants = {
    hidden: { opacity: 0, height: 0, y: -10 },
    visible: { opacity: 1, height: 'auto', y: 0 }
  };

  return (
    <motion.div
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'flex flex-col bg-gradient-to-b from-background to-background/95 border-r border-border/50 backdrop-blur-sm',
        'shadow-lg shadow-primary/5',
        isRTL && 'border-r-0 border-l',
        className
      )}
    >
      {/* Header with Gold Accent */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10"
        layout
      >
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-3 rtl:space-x-reverse"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <Gem className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-lg leading-tight">
                  {t('app.title')}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Professional Edition
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
            'border border-transparent hover:border-primary/20 rounded-lg',
            isCollapsed && 'mx-auto'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ToggleIcon className="h-4 w-4" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = isParentActive(item);
          const isExpanded = expandedItems.has(item.key);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <motion.div
              key={item.key}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
            >
              {/* Main Navigation Item */}
              <div className="relative">
                {hasChildren && !isCollapsed ? (
                  <button
                    onClick={() => toggleExpanded(item.key)}
                    className={cn(
                      'w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      'hover:bg-primary/10 hover:text-primary-700 hover:shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
                      'group relative overflow-hidden',
                      isActive && 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary-700 shadow-sm border border-primary/20',
                      isCollapsed ? 'justify-center' : 'justify-start space-x-3 rtl:space-x-reverse'
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                      isActive ? 'text-primary-600' : 'text-muted-foreground group-hover:text-primary-600'
                    )} />
                    
                    {!isCollapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{t(item.key)}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      'hover:bg-primary/10 hover:text-primary-700 hover:shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
                      'group relative overflow-hidden',
                      isActive && 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary-700 shadow-sm border border-primary/20',
                      isCollapsed ? 'justify-center' : 'justify-start space-x-3 rtl:space-x-reverse'
                    )}
                    title={isCollapsed ? t(item.key) : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                      isActive ? 'text-primary-600' : 'text-muted-foreground group-hover:text-primary-600'
                    )} />
                    
                    {!isCollapsed && (
                      <>
                        <span className="truncate flex-1">{t(item.key)}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )}
              </div>

              {/* Sub-navigation Items */}
              <AnimatePresence>
                {hasChildren && isExpanded && !isCollapsed && (
                  <motion.div
                    variants={subItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.2 }}
                    className="ml-4 mt-1 space-y-1 border-l border-primary/20 pl-4"
                  >
                    {item.children?.filter(child => {
                      if (child.permission && !hasPermission(child.permission)) return false;
                      if (child.roles && !hasAnyRole(child.roles)) return false;
                      return true;
                    }).map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = isActiveRoute(child.href);

                      return (
                        <Link
                          key={child.key}
                          to={child.href}
                          className={cn(
                            'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                            'hover:bg-primary/8 hover:text-primary-600',
                            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
                            'space-x-3 rtl:space-x-reverse relative',
                            isChildActive && 'bg-primary/10 text-primary-700 font-semibold'
                          )}
                        >
                          {ChildIcon ? (
                            <ChildIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          ) : (
                            <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                              <div className={cn(
                                'w-1.5 h-1.5 rounded-full transition-colors duration-200',
                                isChildActive ? 'bg-primary-500' : 'bg-muted-foreground/40'
                              )} />
                            </div>
                          )}
                          <span className="truncate flex-1">{t(child.key)}</span>
                          {child.badge && (
                            <span className="px-1.5 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer with Professional Branding */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="p-4 border-t border-border/50 bg-gradient-to-r from-primary/5 to-primary/10"
          >
            <div className="text-center space-y-1">
              <div className="text-xs font-semibold text-primary-700">
                Gold Shop Management
              </div>
              <div className="text-xs text-muted-foreground">
                Professional Edition v2.0
              </div>
              <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>System Online</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};