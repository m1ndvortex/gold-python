import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  X, 
  Eye, 
  EyeOff,
  Filter,
  Bell,
  BellOff,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface KPIAlert {
  id: string;
  type: 'threshold' | 'trend' | 'anomaly';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  kpi_name: string;
  current_value: number;
  threshold_value?: number;
  trend_percentage?: number;
  created_at: string;
  acknowledged: boolean;
  actionable?: boolean;
  recommendation?: string;
  impact_level?: 'critical' | 'moderate' | 'minor';
}

interface AlertsPanelProps {
  alerts: KPIAlert[];
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onViewDetails?: (alert: KPIAlert) => void;
  className?: string;
  compactMode?: boolean;
  maxHeight?: string;
  showFilters?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAcknowledge,
  onDismiss,
  onViewDetails,
  className,
  compactMode = false,
  maxHeight = '400px',
  showFilters = true
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unacknowledged' | 'high' | 'actionable'>('unacknowledged');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'threshold' | 'trend' | 'anomaly'>('all');

  // Filter alerts based on current tab and filters
  const filteredAlerts = useMemo(() => {
    let filtered = alerts;

    // Filter by tab
    switch (activeTab) {
      case 'unacknowledged':
        filtered = filtered.filter(alert => !alert.acknowledged);
        break;
      case 'high':
        filtered = filtered.filter(alert => alert.severity === 'high');
        break;
      case 'actionable':
        filtered = filtered.filter(alert => alert.actionable);
        break;
      // 'all' shows everything
    }

    // Filter by acknowledged status
    if (!showAcknowledged) {
      filtered = filtered.filter(alert => !alert.acknowledged);
    }

    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(alert => alert.type === selectedType);
    }

    // Sort by severity and creation time
    return filtered.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [alerts, activeTab, showAcknowledged, selectedSeverity, selectedType]);

  // Get alert counts for tabs
  const alertCounts = useMemo(() => ({
    all: alerts.length,
    unacknowledged: alerts.filter(alert => !alert.acknowledged).length,
    high: alerts.filter(alert => alert.severity === 'high').length,
    actionable: alerts.filter(alert => alert.actionable).length
  }), [alerts]);

  // Get alert icon based on type
  const getAlertIcon = (type: string, severity: string) => {
    const iconClass = cn(
      'h-4 w-4',
      severity === 'high' ? 'text-red-500' :
      severity === 'medium' ? 'text-yellow-500' :
      'text-blue-500'
    );

    switch (type) {
      case 'threshold':
        return <Target className={iconClass} />;
      case 'trend':
        return <TrendingDown className={iconClass} />;
      case 'anomaly':
        return <Activity className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  // Get severity badge variant
  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  // Get alert background color
  const getAlertBackgroundColor = (alert: KPIAlert) => {
    if (alert.acknowledged) {
      return 'bg-gray-50 border-gray-200';
    }
    
    switch (alert.severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Format alert value
  const formatAlertValue = (value: number, kpiName: string) => {
    if (kpiName.includes('rate') || kpiName.includes('margin') || kpiName.includes('percentage')) {
      return `${value.toFixed(1)}%`;
    } else if (kpiName.includes('revenue') || kpiName.includes('cost') || kpiName.includes('value')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US').format(value);
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-700 mb-2">All Clear!</h3>
          <p className="text-green-600">No KPI alerts at this time. Your metrics are performing well.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            KPI Alerts
            <Badge variant="secondary">
              {alertCounts.unacknowledged} unread
            </Badge>
          </CardTitle>
          
          {showFilters && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAcknowledged(!showAcknowledged)}
              >
                {showAcknowledged ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showAcknowledged ? 'Hide' : 'Show'} Acknowledged
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Alert Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <div className="px-6 pb-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">
                All ({alertCounts.all})
              </TabsTrigger>
              <TabsTrigger value="unacknowledged" className="text-xs">
                Unread ({alertCounts.unacknowledged})
              </TabsTrigger>
              <TabsTrigger value="high" className="text-xs">
                High ({alertCounts.high})
              </TabsTrigger>
              <TabsTrigger value="actionable" className="text-xs">
                Actionable ({alertCounts.actionable})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-6 pb-3 flex gap-2 flex-wrap">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All Types</option>
                <option value="threshold">Threshold</option>
                <option value="trend">Trend</option>
                <option value="anomaly">Anomaly</option>
              </select>
            </div>
          )}

          {/* Alert List */}
          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="px-6" style={{ maxHeight }}>
              <div className="space-y-3 pb-6">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BellOff className="h-8 w-8 mx-auto mb-2" />
                    <p>No alerts match the current filters</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'border rounded-lg p-4 transition-all duration-200',
                        getAlertBackgroundColor(alert),
                        alert.acknowledged && 'opacity-75',
                        compactMode ? 'p-3' : 'p-4'
                      )}
                    >
                      {/* Alert Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          {getAlertIcon(alert.type, alert.severity)}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={cn(
                                'font-semibold truncate',
                                compactMode ? 'text-sm' : 'text-base'
                              )}>
                                {alert.title}
                              </h4>
                              
                              <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              
                              {alert.actionable && (
                                <Badge variant="outline" className="text-xs">
                                  Actionable
                                </Badge>
                              )}
                            </div>
                            
                            <p className={cn(
                              'text-gray-600 mb-2',
                              compactMode ? 'text-xs' : 'text-sm'
                            )}>
                              {alert.message}
                            </p>
                            
                            {/* Alert Details */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {alert.kpi_name}
                              </span>
                              
                              <span>
                                Current: {formatAlertValue(alert.current_value, alert.kpi_name)}
                              </span>
                              
                              {alert.threshold_value && (
                                <span>
                                  Threshold: {formatAlertValue(alert.threshold_value, alert.kpi_name)}
                                </span>
                              )}
                              
                              {alert.trend_percentage && (
                                <span className="flex items-center gap-1">
                                  {alert.trend_percentage > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                  )}
                                  {Math.abs(alert.trend_percentage).toFixed(1)}%
                                </span>
                              )}
                              
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Alert Actions */}
                        <div className="flex items-center gap-1">
                          {!alert.acknowledged && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAcknowledge(alert.id)}
                              title="Acknowledge alert"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {onViewDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails(alert)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDismiss(alert.id)}
                            title="Dismiss alert"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Recommendation */}
                      {alert.recommendation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          <div className="font-medium text-blue-800 mb-1">Recommendation:</div>
                          <div className="text-blue-700">{alert.recommendation}</div>
                        </div>
                      )}
                      
                      {/* Impact Level */}
                      {alert.impact_level && (
                        <div className="mt-2">
                          <Badge 
                            variant={
                              alert.impact_level === 'critical' ? 'destructive' :
                              alert.impact_level === 'moderate' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {alert.impact_level.toUpperCase()} IMPACT
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};