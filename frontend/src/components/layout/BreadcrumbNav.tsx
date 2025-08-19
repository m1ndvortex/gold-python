import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { 
  Home, 
  ChevronRight, 
  Clock, 
  Star, 
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  History,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  key: string;
  href?: string;
  isCurrentPage?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface BreadcrumbNavProps {
  className?: string;
  showHistory?: boolean;
  showQuickAccess?: boolean;
}

interface NavigationHistoryItem {
  path: string;
  title: string;
  timestamp: Date;
  icon?: React.ComponentType<{ className?: string }>;
}

interface QuickAccessItem {
  key: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

// Route to breadcrumb mapping
const routeBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  '/': [
    { key: 'nav.dashboard', href: '/dashboard' }
  ],
  '/dashboard': [
    { key: 'nav.dashboard', isCurrentPage: true }
  ],
  '/inventory': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.inventory', isCurrentPage: true }
  ],
  '/inventory/add': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.inventory', href: '/inventory' },
    { key: 'common.add', isCurrentPage: true }
  ],
  '/inventory/edit': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.inventory', href: '/inventory' },
    { key: 'common.edit', isCurrentPage: true }
  ],
  '/customers': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.customers', isCurrentPage: true }
  ],
  '/customers/add': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.customers', href: '/customers' },
    { key: 'common.add', isCurrentPage: true }
  ],
  '/customers/edit': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.customers', href: '/customers' },
    { key: 'common.edit', isCurrentPage: true }
  ],
  '/invoices': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.invoices', isCurrentPage: true }
  ],
  '/invoices/create': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.invoices', href: '/invoices' },
    { key: 'common.create', isCurrentPage: true }
  ],
  '/invoices/edit': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.invoices', href: '/invoices' },
    { key: 'common.edit', isCurrentPage: true }
  ],
  '/accounting': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.accounting', isCurrentPage: true }
  ],
  '/accounting/income': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.accounting', href: '/accounting' },
    { key: 'accounting.income', isCurrentPage: true }
  ],
  '/accounting/expense': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.accounting', href: '/accounting' },
    { key: 'accounting.expense', isCurrentPage: true }
  ],
  '/accounting/cash-bank': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.accounting', href: '/accounting' },
    { key: 'accounting.cash_bank', isCurrentPage: true }
  ],
  '/accounting/gold-weight': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.accounting', href: '/accounting' },
    { key: 'accounting.gold_weight', isCurrentPage: true }
  ],
  '/accounting/profit-loss': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.accounting', href: '/accounting' },
    { key: 'accounting.profit_loss', isCurrentPage: true }
  ],
  '/accounting/debt-tracking': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.accounting', href: '/accounting' },
    { key: 'accounting.debt_tracking', isCurrentPage: true }
  ],
  '/reports': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.reports', isCurrentPage: true }
  ],
  '/reports/sales': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.reports', href: '/reports' },
    { key: 'reports.sales', isCurrentPage: true }
  ],
  '/reports/inventory': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.reports', href: '/reports' },
    { key: 'reports.inventory', isCurrentPage: true }
  ],
  '/reports/customers': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.reports', href: '/reports' },
    { key: 'reports.customers', isCurrentPage: true }
  ],
  '/sms': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.sms', isCurrentPage: true }
  ],
  '/sms/campaign': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.sms', href: '/sms' },
    { key: 'sms.campaign', isCurrentPage: true }
  ],
  '/sms/templates': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.sms', href: '/sms' },
    { key: 'sms.templates', isCurrentPage: true }
  ],
  '/sms/history': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.sms', href: '/sms' },
    { key: 'sms.history', isCurrentPage: true }
  ],
  '/settings': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.settings', isCurrentPage: true }
  ],
  '/settings/company': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.settings', href: '/settings' },
    { key: 'settings.company', isCurrentPage: true }
  ],
  '/settings/gold-price': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.settings', href: '/settings' },
    { key: 'settings.gold_price', isCurrentPage: true }
  ],
  '/settings/invoice-template': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.settings', href: '/settings' },
    { key: 'settings.invoice_template', isCurrentPage: true }
  ],
  '/settings/roles': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.settings', href: '/settings' },
    { key: 'settings.roles', isCurrentPage: true }
  ],
  '/settings/users': [
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.settings', href: '/settings' },
    { key: 'settings.users', isCurrentPage: true }
  ],
};

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ 
  className, 
  showHistory = true, 
  showQuickAccess = true 
}) => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Quick access items - frequently used pages
  const quickAccessItems: QuickAccessItem[] = [
    {
      key: 'nav.dashboard',
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      key: 'nav.inventory',
      title: 'Inventory',
      href: '/inventory',
      icon: Home, // Replace with appropriate icon
      badge: 'Hot',
    },
    {
      key: 'nav.customers',
      title: 'Customers',
      href: '/customers',
      icon: Home, // Replace with appropriate icon
    },
    {
      key: 'nav.invoices',
      title: 'Invoices',
      href: '/invoices',
      icon: Home, // Replace with appropriate icon
    },
  ];

  // Track navigation history
  useEffect(() => {
    const currentPath = location.pathname;
    const currentTitle = getBreadcrumbItems().pop()?.key || 'nav.dashboard';
    
    setNavigationHistory(prev => {
      // Don't add duplicate consecutive entries
      if (prev.length > 0 && prev[prev.length - 1].path === currentPath) {
        return prev;
      }
      
      const newItem: NavigationHistoryItem = {
        path: currentPath,
        title: t(currentTitle),
        timestamp: new Date(),
      };
      
      // Keep only last 10 items
      const updated = [...prev, newItem].slice(-10);
      return updated;
    });

    // Update browser navigation state
    setCanGoBack(window.history.length > 1);
    setCanGoForward(false); // This would need more complex state management
  }, [location.pathname, t]);

  // Get breadcrumb items for current path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const pathname = location.pathname;
    
    // Check for exact match first
    if (routeBreadcrumbs[pathname]) {
      return routeBreadcrumbs[pathname];
    }

    // Check for dynamic routes (e.g., /customers/123/edit)
    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Try to match patterns like /customers/:id/edit
    if (pathSegments.length >= 3) {
      const basePath = `/${pathSegments[0]}`;
      const action = pathSegments[pathSegments.length - 1];
      
      if (routeBreadcrumbs[`${basePath}/${action}`]) {
        return routeBreadcrumbs[`${basePath}/${action}`];
      }
    }

    // Try to match base path
    if (pathSegments.length >= 1) {
      const basePath = `/${pathSegments[0]}`;
      if (routeBreadcrumbs[basePath]) {
        return routeBreadcrumbs[basePath];
      }
    }

    // Default fallback
    return [{ key: 'nav.dashboard', isCurrentPage: true }];
  };

  const breadcrumbItems = getBreadcrumbItems();

  const handleGoBack = () => {
    if (canGoBack) {
      navigate(-1);
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      navigate(1);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Don't show breadcrumbs if only one item (dashboard) and no additional features
  if (breadcrumbItems.length <= 1 && !showHistory && !showQuickAccess) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex items-center justify-between py-3 px-4 lg:px-6 bg-gradient-to-r from-background to-background/95',
        'border-b border-border/50 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {/* Navigation Controls */}
        {showHistory && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              disabled={!canGoBack}
              className={cn(
                'h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                !canGoBack && 'text-muted-foreground'
              )}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoForward}
              disabled={!canGoForward}
              className={cn(
                'h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                !canGoForward && 'text-muted-foreground'
              )}
              aria-label="Go forward"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* History Dropdown */}
            <DropdownMenu open={showHistoryDropdown} onOpenChange={setShowHistoryDropdown}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
                    showHistoryDropdown && 'bg-primary/10 text-primary-600'
                  )}
                  aria-label="Navigation history"
                >
                  <History className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Recent Pages
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navigationHistory.length > 0 ? (
                  navigationHistory.slice(-5).reverse().map((item, index) => (
                    <DropdownMenuItem
                      key={`${item.path}-${index}`}
                      onClick={() => navigate(item.path)}
                      className="cursor-pointer hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{item.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    <span className="text-muted-foreground">No recent pages</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Enhanced Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList className="flex items-center">
            {/* Home icon for first item */}
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  to="/dashboard" 
                  className={cn(
                    'flex items-center p-2 rounded-lg hover:bg-primary/10 hover:text-primary-600',
                    'transition-all duration-200 group'
                  )}
                >
                  <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={`${item.key}-${index}`}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {item.isCurrentPage ? (
                    <BreadcrumbPage className={cn(
                      'flex items-center space-x-2 px-3 py-1.5 rounded-lg',
                      'bg-primary/10 text-primary-700 font-semibold'
                    )}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{t(item.key)}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        to={item.href!}
                        className={cn(
                          'flex items-center space-x-2 px-3 py-1.5 rounded-lg',
                          'hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
                          'text-muted-foreground hover:text-primary-600'
                        )}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{t(item.key)}</span>
                        {item.badge && (
                          <Badge variant="outline" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Quick Access */}
      {showQuickAccess && (
        <div className="hidden lg:flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
                  'border border-transparent hover:border-primary/20 rounded-lg'
                )}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                <span className="text-sm">{t('common.quick_access')}</span>
                <MoreHorizontal className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Frequently Used
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickAccessItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => navigate(item.href)}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                <Star className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Add to Favorites</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Mobile Quick Access */}
      {showQuickAccess && (
        <div className="lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t('common.quick_access')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickAccessItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.key}
                    onClick={() => navigate(item.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </motion.div>
  );
};