import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Bell,
  BellRing,
  Settings,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Zap,
  Eye,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric_name: string;
  condition_type: 'threshold' | 'percentage_change' | 'anomaly' | 'trend';
  threshold_value?: number;
  comparison_operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  time_window: number; // in minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_channels: string[];
  business_rules: {
    business_hours_only: boolean;
    exclude_weekends: boolean;
    minimum_interval: number; // minutes between alerts
  };
  created_at: string;
  updated_at: string;
  last_triggered?: string;
  trigger_count: number;
}

interface Alert {
  id: string;
  rule_id: string;
  rule_name: string;
  metric_name: string;
  current_value: number;
  threshold_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  anomaly_score?: number;
}

interface IntelligentAlertingInterfaceProps {
  className?: string;
}

export const IntelligentAlertingInterface: React.FC<IntelligentAlertingInterfaceProps> = ({
  className
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'configuration'>('alerts');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const queryClient = useQueryClient();

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['intelligent-alerts', selectedSeverity, selectedStatus],
    queryFn: async (): Promise<Alert[]> => {
      const params = new URLSearchParams();
      if (selectedSeverity !== 'all') params.append('severity', selectedSeverity);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      return apiGet<Alert[]>(`/advanced-analytics/alerts?${params.toString()}`);
    },
    refetchInterval: 30000, // 30 seconds
  });

  // Fetch alert rules
  const { data: alertRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: async (): Promise<AlertRule[]> => {
      return apiGet<AlertRule[]>('/advanced-analytics/alert-rules');
    },
  });

  // Mutations for alert management
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiPut(`/advanced-analytics/alerts/${alertId}/acknowledge`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligent-alerts'] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiPut(`/advanced-analytics/alerts/${alertId}/resolve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligent-alerts'] });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: Partial<AlertRule>) => {
      return apiPost('/advanced-analytics/alert-rules', rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      setIsCreatingRule(false);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, rule }: { id: string; rule: Partial<AlertRule> }) => {
      return apiPut(`/advanced-analytics/alert-rules/${id}`, rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      setEditingRule(null);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return apiDelete(`/advanced-analytics/alert-rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <BellRing className="h-4 w-4 text-red-500" />;
      case 'acknowledged':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
              <BellRing className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Intelligent Alerting</h1>
              <p className="text-muted-foreground text-lg">
                AI-powered business rules and anomaly detection alerts
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
            <Zap className="h-3 w-3" />
            Real-time Monitoring
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Alerts
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-700">Critical</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-700">
                {alerts?.filter(a => a.severity === 'critical' && a.status === 'active').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-700">
                {alerts?.filter(a => a.status === 'active').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Rules</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-700">
                {alertRules?.filter(r => r.enabled).length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Active Rules</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Resolved</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-700">
                {alerts?.filter(a => a.status === 'resolved').length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Resolved Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-b-2 border-red-200">
              <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  value="alerts" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-red-300"
                >
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <BellRing className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Active Alerts</div>
                    <div className="text-xs text-muted-foreground">Current Notifications</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="rules" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-orange-300"
                >
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Target className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Alert Rules</div>
                    <div className="text-xs text-muted-foreground">Rule Management</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="configuration" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-yellow-300"
                >
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Configuration</div>
                    <div className="text-xs text-muted-foreground">System Settings</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Active Alerts Tab */}
            <TabsContent value="alerts" className="p-6 space-y-6 bg-gradient-to-br from-red-50/30 to-white">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="severity-filter">Severity:</Label>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter">Status:</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Alerts List */}
              {alertsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <Card key={alert.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center gap-2">
                              {getSeverityIcon(alert.severity)}
                              {getStatusIcon(alert.status)}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-lg">{alert.rule_name}</h3>
                                <Badge className={getSeverityColor(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                                <Badge variant="outline">
                                  {alert.status}
                                </Badge>
                              </div>
                              <p className="text-gray-700">{alert.message}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Metric: {alert.metric_name}</span>
                                <span>Current: {alert.current_value.toLocaleString()}</span>
                                <span>Threshold: {alert.threshold_value.toLocaleString()}</span>
                                <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                                  disabled={acknowledgeAlertMutation.isPending}
                                >
                                  Acknowledge
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => resolveAlertMutation.mutate(alert.id)}
                                  disabled={resolveAlertMutation.isPending}
                                >
                                  Resolve
                                </Button>
                              </>
                            )}
                            {alert.status === 'acknowledged' && (
                              <Button
                                size="sm"
                                onClick={() => resolveAlertMutation.mutate(alert.id)}
                                disabled={resolveAlertMutation.isPending}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No alerts found</p>
                </div>
              )}
            </TabsContent>

            {/* Alert Rules Tab */}
            <TabsContent value="rules" className="p-6 space-y-6 bg-gradient-to-br from-orange-50/30 to-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Alert Rules</h2>
                <Button onClick={() => setIsCreatingRule(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Rule
                </Button>
              </div>

              {rulesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
                        <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : alertRules && alertRules.length > 0 ? (
                <div className="space-y-4">
                  {alertRules.map((rule) => (
                    <Card key={rule.id} className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{rule.name}</h3>
                              <Badge className={getSeverityColor(rule.severity)}>
                                {rule.severity}
                              </Badge>
                              <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                                {rule.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <p className="text-gray-700">{rule.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Metric: {rule.metric_name}</span>
                              <span>Condition: {rule.condition_type}</span>
                              <span>Threshold: {rule.threshold_value}</span>
                              <span>Triggers: {rule.trigger_count}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRule(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRuleMutation.mutate(rule.id)}
                              disabled={deleteRuleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No alert rules configured</p>
                </div>
              )}
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="p-6 space-y-6 bg-gradient-to-br from-yellow-50/30 to-white">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Notifications</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="email-notifications" />
                        <Label htmlFor="email-notifications">Enable email alerts</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>SMS Notifications</Label>
                      <div className="flex items-center space-x-2">
                        <Switch id="sms-notifications" />
                        <Label htmlFor="sms-notifications">Enable SMS alerts</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Anomaly Detection Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sensitivity Level</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Learning Period (days)</Label>
                      <Input type="number" defaultValue="30" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentAlertingInterface;