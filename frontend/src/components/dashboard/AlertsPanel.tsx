import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LowStockItem, UnpaidInvoice } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { 
  AlertTriangle, 
  Clock, 
  Package, 
  CreditCard, 
  Bell, 
  BellOff, 
  Filter,
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

  // Convert raw data to enhanced alerts
  const enhancedAlerts = useMemo((): EnhancedAlert[] => {
    const alerts: EnhancedAlert[] = [];

    // Process low stock items
    if (lowStockItems) {
      lowStockItems.forEach(item => {
        const priority: AlertPriority = item.status === 'critical' ? 'critical' : 'high';
        alerts.push({
          id: `stock-${item.item_id}`,
          title: `Low Stock: ${item.item_name}`,
          description: `${item.category_name} • Current: ${item.current_stock}, Min: ${item.min_stock_level}`,
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

    // Process unpaid invoices
    if (unpaidInvoices) {
      unpaidInvoices.forEach(invoice => {
        let priority: AlertPriority = 'medium';
        if (invoice.days_overdue > 30) priority = 'critical';
        else if (invoice.days_overdue > 7) priority = 'high';

        alerts.push({
          id: `invoice-${invoice.invoice_id}`,
          title: `Overdue Payment: ${invoice.invoice_number}`,
          description: `${invoice.customer_name} • ${formatCurrency(invoice.remaining_amount)} • ${invoice.days_overdue} days overdue`,
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
  }, [lowStockItems, unpaidInvoices, readAlerts, dismissedAlerts]);

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

    if (alert.category === 'inventory') {
      onLowStockClick(alert.data.item_id);
    } else if (alert.category === 'finance') {
      onInvoiceClick(alert.data.invoice_id);
    }
  };

  const unreadCount = enhancedAlerts.filter(alert => !alert.isRead && !alert.isDismissed).length;
  const criticalCount = enhancedAlerts.filter(alert => alert.priority === 'critical' && !alert.isDismissed).length;

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-amber-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
              className="h-8"
            >
              {showDismissed ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showDismissed ? t('dashboard.hide_dismissed') : t('dashboard.show_dismissed')}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>{t('dashboard.tab_all').replace('{count}', enhancedAlerts.filter(a => !showDismissed ? !a.isDismissed : true).length.toString())}</span>
            </TabsTrigger>
            <TabsTrigger value="critical" className="flex items-center space-x-2">
              <XCircle className="w-4 h-4" />
              <span>{t('dashboard.tab_critical').replace('{count}', criticalCount.toString())}</span>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center space-x-2">
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
                  relative p-4 border rounded-lg cursor-pointer transition-all duration-200
                  hover:shadow-md hover:border-amber-300
                  ${alert.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-amber-200 shadow-sm'}
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
                      p-2 rounded-full flex-shrink-0
                      ${alert.category === 'inventory' ? 'bg-blue-100 text-blue-600' :
                        alert.category === 'finance' ? 'bg-green-100 text-green-600' :
                        alert.category === 'customer' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'}
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
                          <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
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
                          <span className="flex items-center space-x-1 text-amber-600">
                            <TrendingUp className="w-3 h-3" />
                            <span>Action Required</span>
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
                        <span className="capitalize">{alert.priority}</span>
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
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        aria-label="Dismiss alert"
                        title="Dismiss alert"
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
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
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