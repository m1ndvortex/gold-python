import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { LowStockItem, UnpaidInvoice } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { usePermissions } from '../../hooks/usePermissions';
import { WithPermissions } from '../auth/WithPermissions';
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  CreditCard, 
  Bell, 
  BellOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  Archive,
  Eye,
  EyeOff
} from 'lucide-react';

interface AlertsPanelProps {
  lowStockItems: LowStockItem[] | null;
  unpaidInvoices: UnpaidInvoice[] | null;
  isLoading: boolean;
  onLowStockClick: (itemId: string) => void;
  onInvoiceClick: (invoiceId: string) => void;
  onMarkAsRead?: (alertId: string, type: 'stock' | 'invoice') => void;
  onDismissAlert?: (alertId: string, type: 'stock' | 'invoice') => void;
}

type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertCategory = 'inventory' | 'finance' | 'system' | 'customer';

interface EnhancedAlert {
  id: string;
  title: string;
  description: string;
  category: AlertCategory;
  priority: AlertPriority;
  timestamp: Date;
  isRead: boolean;
  isDismissed: boolean;
  actionRequired: boolean;
  data: any;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  lowStockItems,
  unpaidInvoices,
  isLoading,
  onLowStockClick,
  onInvoiceClick,
  onMarkAsRead,
  onDismissAlert
}) => {
  const { t } = useLanguage();
  const { hasPermission, canManageInventory, canManageCustomers } = usePermissions();
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'unread'>('all');
  const [showDismissed, setShowDismissed] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const getPriorityColor = (priority: AlertPriority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: AlertPriority) => {
    switch (priority) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'inventory': return <Package className="w-4 h-4" />;
      case 'finance': return <DollarSign className="w-4 h-4" />;
      case 'customer': return <CreditCard className="w-4 h-4" />;
      case 'system': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  // Convert raw data to enhanced alerts with permission filtering
  const enhancedAlerts = useMemo((): EnhancedAlert[] => {
    const alerts: EnhancedAlert[] = [];

    // Process low stock items - only if user has inventory permissions
    if (lowStockItems && hasPermission('inventory:view')) {
      lowStockItems.forEach(item => {
        const priority: AlertPriority = item.status === 'critical' ? 'critical' : 'high';
        alerts.push({
          id: `stock-${item.item_id}`,
          title: t('dashboard.low_stock_alert', { product: item.item_name }),
          description: t('dashboard.current_stock', { current: item.current_stock, min: item.min_stock_level }) + ` • ${item.category_name}`,
          category: 'inventory',
          priority,
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Mock timestamp
          isRead: readAlerts.has(`stock-${item.item_id}`),
          isDismissed: dismissedAlerts.has(`stock-${item.item_id}`),
          actionRequired: true,
          data: item
        });
      });
    }

    // Process unpaid invoices - only if user has customer or invoice permissions
    if (unpaidInvoices && (hasPermission('invoices:view') || hasPermission('customers:view'))) {
      unpaidInvoices.forEach(invoice => {
        let priority: AlertPriority = 'medium';
        if (invoice.days_overdue > 30) priority = 'critical';
        else if (invoice.days_overdue > 7) priority = 'high';

        alerts.push({
          id: `invoice-${invoice.invoice_id}`,
          title: t('dashboard.overdue_payment', { invoice: invoice.invoice_number }),
          description: `${invoice.customer_name} • ${formatCurrency(invoice.remaining_amount)} • ${invoice.days_overdue} ${t('dashboard.days_overdue')}`,
          category: 'finance',
          priority,
          timestamp: new Date(Date.now() - invoice.days_overdue * 24 * 60 * 60 * 1000),
          isRead: readAlerts.has(`invoice-${invoice.invoice_id}`),
          isDismissed: dismissedAlerts.has(`invoice-${invoice.invoice_id}`),
          actionRequired: true,
          data: invoice
        });
      });
    }

    return alerts.sort((a, b) => {
      // Sort by priority first, then by timestamp
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [lowStockItems, unpaidInvoices, readAlerts, dismissedAlerts, hasPermission]);

  // Filter alerts based on active tab
  const filteredAlerts = useMemo(() => {
    let filtered = enhancedAlerts;

    if (!showDismissed) {
      filtered = filtered.filter(alert => !alert.isDismissed);
    }

    switch (activeTab) {
      case 'critical':
        return filtered.filter(alert => alert.priority === 'critical');
      case 'unread':
        return filtered.filter(alert => !alert.isRead);
      default:
        return filtered;
    }
  }, [enhancedAlerts, activeTab, showDismissed]);

  const handleMarkAsRead = (alertId: string) => {
    setReadAlerts(prev => new Set(Array.from(prev).concat(alertId)));
    const alert = enhancedAlerts.find(a => a.id === alertId);
    if (alert && onMarkAsRead) {
      const type = alertId.startsWith('stock-') ? 'stock' : 'invoice';
      onMarkAsRead(alertId, type);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(Array.from(prev).concat(alertId)));
    if (onDismissAlert) {
      const type = alertId.startsWith('stock-') ? 'stock' : 'invoice';
      onDismissAlert(alertId, type);
    }
  };

  const handleAlertClick = (alert: EnhancedAlert) => {
    if (!alert.isRead) {
      handleMarkAsRead(alert.id);
    }

    // Check permissions before allowing navigation
    if (alert.category === 'inventory' && canManageInventory()) {
      onLowStockClick(alert.data.item_id);
    } else if (alert.category === 'finance' && canManageCustomers()) {
      onInvoiceClick(alert.data.invoice_id);
    }
  };

  const unreadCount = enhancedAlerts.filter(alert => !alert.isRead && !alert.isDismissed).length;
  const criticalCount = enhancedAlerts.filter(alert => alert.priority === 'critical' && !alert.isDismissed).length;

  if (isLoading) {
    return (
      <Card className="animate-pulse border-0 shadow-xl bg-gradient-to-br from-green-50/30 via-teal-50/20 to-blue-50/10">
        <CardHeader className="bg-gradient-to-r from-green-50/50 via-teal-50/40 to-blue-50/30 rounded-t-xl">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 bg-gradient-to-br from-green-300 to-teal-400 rounded-2xl shadow-lg"></div>
            <div>
              <div className="h-7 bg-gradient-to-r from-green-300 to-teal-400 rounded-lg w-52"></div>
              <div className="h-5 bg-gradient-to-r from-green-300 to-teal-400 rounded-lg w-72 mt-3"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-5 border rounded-xl bg-gradient-to-r from-white/70 to-green-50/30 shadow-md">
                <div className="h-10 w-10 bg-gradient-to-br from-green-300 to-teal-400 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gradient-to-r from-green-300 to-teal-400 rounded-lg w-3/4 mb-3"></div>
                  <div className="h-4 bg-gradient-to-r from-green-300 to-teal-400 rounded-lg w-1/2"></div>
                </div>
                <div className="h-7 bg-gradient-to-r from-green-300 to-teal-400 rounded-lg w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-green-50/30 via-teal-50/20 to-blue-50/10 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
      <CardHeader className="pb-6 bg-gradient-to-r from-green-50/50 via-teal-50/40 to-blue-50/30 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {t('dashboard.alerts_notifications')}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {filteredAlerts.length} {t('dashboard.alerts')} • {unreadCount} {t('dashboard.unread')}
                {criticalCount > 0 && (
                  <span className="ml-2 text-red-600 font-medium">
                    • {criticalCount} {t('dashboard.critical')}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDismissed(!showDismissed)}
              className="h-8 bg-gradient-to-r from-green-50 to-teal-50 border-green-200 hover:from-green-100 hover:to-teal-100 hover:border-green-300 transition-all duration-300"
            >
              {showDismissed ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showDismissed ? t('dashboard.hide_dismissed') : t('dashboard.show_dismissed')}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="all" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300 transition-all duration-300"
            >
              <Bell className="w-4 h-4" />
              <span>{t('dashboard.tab_all').replace('{count}', enhancedAlerts.filter(a => !showDismissed ? !a.isDismissed : true).length.toString())}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="critical" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-red-300 transition-all duration-300"
            >
              <XCircle className="w-4 h-4" />
              <span>{t('dashboard.tab_critical').replace('{count}', criticalCount.toString())}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="unread" 
              className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300 transition-all duration-300"
            >
              <BellOff className="w-4 h-4" />
              <span>{t('dashboard.tab_unread').replace('{count}', unreadCount.toString())}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`
                  relative p-4 border-0 rounded-lg cursor-pointer transition-all duration-300
                  hover:shadow-lg hover:scale-[1.01]
                  ${alert.isRead 
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100/50 shadow-sm' 
                    : 'bg-gradient-to-r from-white to-green-50/20 shadow-md hover:shadow-xl'
                  }
                  ${alert.isDismissed ? 'opacity-60' : ''}
                `}
                onClick={() => handleAlertClick(alert)}
              >
                {/* Priority indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                  alert.priority === 'critical' ? 'bg-red-500' :
                  alert.priority === 'high' ? 'bg-orange-500' :
                  alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />

                <div className="flex items-start justify-between ml-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Category icon */}
                    <div className={`
                      p-2 rounded-xl flex-shrink-0 shadow-md transition-all duration-300
                      ${alert.category === 'inventory' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' :
                        alert.category === 'finance' ? 'bg-gradient-to-br from-green-500 to-teal-600 text-white' :
                        alert.category === 'customer' ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white' :
                        'bg-gradient-to-br from-gray-500 to-gray-600 text-white'}
                    `}>
                      {getCategoryIcon(alert.category)}
                    </div>

                    {/* Alert content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`text-sm font-medium truncate ${
                          alert.isRead ? 'text-gray-700' : 'text-gray-900'
                        }`}>
                          {alert.title}
                        </h4>
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {alert.description}
                      </p>
                      
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                        </span>
                        {alert.actionRequired && (
                          <span className="flex items-center space-x-1 text-teal-600">
                            <TrendingUp className="w-3 h-3" />
                            <span>{t('common.action_required')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority badge and actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={`${getPriorityColor(alert.priority)} text-xs font-medium`}>
                      <span className="flex items-center space-x-1">
                        {getPriorityIcon(alert.priority)}
                        <span className="capitalize">{t(`common.${alert.priority}`)}</span>
                      </span>
                    </Badge>
                    
                    {!alert.isDismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissAlert(alert.id);
                        }}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-lg transition-all duration-300"
                        aria-label={t('common.dismiss_alert')}
                        title={t('common.dismiss_alert')}
                      >
                        <Archive className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('dashboard.all_clear')}</h3>
              <p className="text-gray-600">
                {t('dashboard.no_alerts')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};