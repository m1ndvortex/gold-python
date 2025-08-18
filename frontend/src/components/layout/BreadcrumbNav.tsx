import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { Home } from 'lucide-react';

interface BreadcrumbItem {
  key: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface BreadcrumbNavProps {
  className?: string;
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

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ className }) => {
  const { t } = useLanguage();
  const location = useLocation();

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

  // Don't show breadcrumbs if only one item (dashboard)
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home icon for first item */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`${item.key}-${index}`}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isCurrentPage ? (
                <BreadcrumbPage>{t(item.key)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.href!}>{t(item.key)}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};