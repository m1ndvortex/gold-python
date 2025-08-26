import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  RefreshCw,
  Bell,
  BellOff,
  Settings,
  Eye,
  EyeOff,
  Filter,
  Download,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';
import { stockAlertsApi, inventoryAnalyticsApi } from '../../services/universalInventoryApi';
import type { 
  LowStockAlert, 
  StockAlertsResponse, 
  StockAlertLevel,
  UniversalCategory 
} from '../../types/universalInventory';

interface StockLevelMonitorProps {
  categories?: UniversalCategory[];
  businessType?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  onItemClick?: (itemId: string) => void;
  className?: string;
}

interface MonitorSettings {
  thresholdMultiplier: number;
  enableNotifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  selectedCategories: string[];
  alertLevels: StockAlertLevel[];
  sortBy: 'urgency' | 'name' | 'shortage' | 'value';
  sortOrder: 'asc' | 'desc';
}

const defaultSettings: MonitorSettings = {
  thresholdMultiplier: 1.0,
  enableNotifications: true,
  autoRefresh: true,
  refreshInterval: 30,
  selectedCategories: [],
  alertLevels: ['out_of_stock', 'critical', 'low', 'warning'],
  sortBy: 'urgency',
  sortOrder: 'desc',
};

const ALERT_LEVEL_CONFIG = {
  out_of_stock: {
    label: 'Out of Stock',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    variant: 'destructive' as const,
    priority: 4,
  },
  critical: {
    label: 'Critical',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    variant: 'destructive' as const,
    priority: 3,
  },
  low: {
    label: 'Low Stock',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    variant: 'secondary' as const,
    priority: 2,
  },
  warning: {
    label: 'Warning',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    variant: 'secondary' as const,
    priority: 1,
  },
};

export const StockLevelMonitor: React.FC<StockLevelMonitorProps> = ({
  categories = [],
  businessType,
  autoRefresh = true,
  refreshInterval = 30,
  onItemClick,
  className
}) => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [alertsResponse, setAlertsResponse] = useState<StockAlertsResponse | null>(null);
  const [settings, setSettings] = useState<MonitorSettings>({
    ...defaultSettings,
    autoRefresh,
    refreshInterval,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh effect
  useEffect(() => {
    if (settings.autoRefresh && settings.refreshInterval > 0) {
      const interval = setInterval(() => {
        loadStockAlerts();
      }, settings.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, settings.refreshInterval, settings.thresholdMultiplier, settings.selectedCategories]);

  // Initial load
  useEffect(() => {
    loadStockAlerts();
  }, [businessType]);

  const loadStockAlerts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await stockAlertsApi.getLowStockAlerts(
        settings.thresholdMultiplier,
        settings.selectedCategories.length > 0 ? settings.selectedCategories : undefined,
        businessType
      );
      
      setAlertsResponse(response);
      
      // Filter and sort alerts
      let filteredAlerts = response.alerts.filter(alert => 
        settings.alertLevels.includes(alert.alert_level)
      );

      // Sort alerts
      filteredAlerts = filteredAlerts.sort((a, b) => {
        switch (settings.sortBy) {
          case 'urgency':
            const priorityA = ALERT_LEVEL_CONFIG[a.alert_level]?.priority || 0;
            const priorityB = ALERT_LEVEL_CONFIG[b.alert_level]?.priority || 0;
            return settings.sortOrder === 'desc' ? priorityB - priorityA : priorityA - priorityB;
          case 'name':
            return settings.sortOrder === 'desc' 
              ? b.item_name.localeCompare(a.item_name)
              : a.item_name.localeCompare(b.item_name);
          case 'shortage':
            return settings.sortOrder === 'desc' ? b.shortage - a.shortage : a.shortage - b.shortage;
          case 'value':
            const valueA = a.unit_cost * a.shortage;
            const valueB = b.unit_cost * b.shortage;
            return settings.sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
          default:
            return 0;
        }
      });

      setAlerts(filteredAlerts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load stock alerts:', error);
      setError('Failed to load stock alerts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = (updates: Partial<MonitorSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const getStockLevelPercentage = (alert: LowStockAlert) => {
    if (alert.min_stock_level === 0) return 0;
    return Math.max(0, (alert.current_stock / alert.min_stock_level) * 100);
  };

  const getTotalPotentialLoss = () => {
    return alerts.reduce((total, alert) => total + alert.potential_lost_sales, 0);
  };

  const getAlertsByLevel = () => {
    const grouped = alerts.reduce((acc, alert) => {
      if (!acc[alert.alert_level]) {
        acc[alert.alert_level] = [];
      }
      acc[alert.alert_level].push(alert);
      return acc;
    }, {} as Record<StockAlertLevel, LowStockAlert[]>);

    return grouped;
  };

  const AlertCard: React.FC<{ alert: LowStockAlert; index: number }> = ({ alert, index }) => {
    const config = ALERT_LEVEL_CONFIG[alert.alert_level];
    const stockPercentage = getStockLevelPercentage(alert);
    const potentialLoss = alert.unit_cost * alert.shortage;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
      >
        <Card 
          className={cn(
            "cursor-pointer hover:shadow-md transition-all duration-200 border-l-4",
            config.borderColor,
            config.bgColor
          )}
          onClick={() => onItemClick?.(alert.item_id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold truncate">{alert.item_name}</h4>
                  <Badge variant={config.variant} className="text-xs">
                    {config.label}
                  </Badge>
                </div>
                
                {alert.sku && (
                  <p className="text-sm text-muted-foreground mb-2">
                    SKU: {alert.sku}
                  </p>
                )}
                
                {alert.category_name && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Category: {alert.category_name}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Stock:</span>
                    <span className={cn("font-mono font-semibold", config.color)}>
                      {alert.current_stock}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Minimum Level:</span>
                    <span className="font-mono">{alert.min_stock_level}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Shortage:</span>
                    <span className="font-mono font-semibold text-red-600">
                      {alert.shortage}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Stock Level</span>
                      <span>{stockPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={stockPercentage} 
                      className={cn(
                        "h-2",
                        stockPercentage < 25 ? "[&>div]:bg-red-500" :
                        stockPercentage < 50 ? "[&>div]:bg-yellow-500" :
                        "[&>div]:bg-green-500"
                      )}
                    />
                  </div>

                  {potentialLoss > 0 && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span>Potential Loss:</span>
                      <span className="font-mono font-semibold text-red-600">
                        ${potentialLoss.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4 flex flex-col items-end gap-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", config.bgColor)}>
                  <AlertTriangle className={cn("h-4 w-4", config.color)} />
                </div>
                
                <div className="text-xs text-muted-foreground text-right">
                  Urgency: {alert.urgency_score}/10
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card variant="gradient-red">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              Stock Level Monitor
              <Badge variant="secondary">{alerts.length} alerts</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadStockAlerts}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </CardHeader>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="border-t bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Threshold Multiplier</Label>
                    <Select
                      value={settings.thresholdMultiplier.toString()}
                      onValueChange={(value) => updateSettings({ thresholdMultiplier: parseFloat(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5x (More sensitive)</SelectItem>
                        <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                        <SelectItem value="1.5">1.5x (Less sensitive)</SelectItem>
                        <SelectItem value="2.0">2.0x (Least sensitive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select
                      value={settings.sortBy}
                      onValueChange={(value) => updateSettings({ sortBy: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgency">Urgency</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="shortage">Shortage</SelectItem>
                        <SelectItem value="value">Potential Loss</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Select
                      value={settings.sortOrder}
                      onValueChange={(value) => updateSettings({ sortOrder: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.autoRefresh}
                        onCheckedChange={(checked) => updateSettings({ autoRefresh: checked })}
                      />
                      <Label>Auto Refresh</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.enableNotifications}
                        onCheckedChange={(checked) => updateSettings({ enableNotifications: checked })}
                      />
                      <Label>Notifications</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Summary Stats */}
      {alertsResponse && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="gradient-red">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                  <p className="text-2xl font-bold">{alerts.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient-yellow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold">
                    {alerts.filter(a => a.alert_level === 'out_of_stock').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient-orange">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold">
                    {alerts.filter(a => a.alert_level === 'critical').length}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient-green">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Potential Loss</p>
                  <p className="text-2xl font-bold">${getTotalPotentialLoss().toFixed(0)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <Card variant="professional">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stock Alerts</span>
            {alerts.length > 0 && (
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading stock alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg mx-auto">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600">All Good!</h3>
                <p className="text-muted-foreground">
                  No stock alerts at this time. All items are well stocked.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <AlertCard key={alert.item_id} alert={alert} index={index} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};