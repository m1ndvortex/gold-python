import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, X, Clock, User } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AlertNotification {
  id: string;
  rule_id: string;
  rule_name: string;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  triggered_value?: number;
  entity_type?: string;
  notification_sent: boolean;
  acknowledged: boolean;
  acknowledged_by?: string;
  triggered_at?: string;
  acknowledged_at?: string;
}

interface AlertRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  severity: string;
  notification_channels: any;
  cooldown_minutes: number;
  escalation_rules: any;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface AlertSummary {
  total_alerts: number;
  acknowledged_alerts: number;
  unacknowledged_alerts: number;
  severity_breakdown: Record<string, number>;
  active_rules: number;
  generated_at: string;
}

interface AlertNotificationPanelProps {
  className?: string;
}

const AlertNotificationPanel: React.FC<AlertNotificationPanelProps> = ({ className = '' }) => {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // WebSocket connection for real-time alerts
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://localhost:8000/alerts/ws`);
        
        ws.onopen = () => {
          console.log('Alert WebSocket connected');
          ws.send('connection_test');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'alert') {
              // Add new alert to the list
              setAlerts(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50 alerts
              
              // Show browser notification if supported
              if (Notification.permission === 'granted') {
                new Notification(`🚨 ${data.data.rule_name}`, {
                  body: data.data.message,
                  icon: '/favicon.ico'
                });
              }
            } else if (data.type === 'acknowledgment') {
              // Update alert acknowledgment status
              setAlerts(prev => prev.map(alert => 
                alert.id === data.alert_id 
                  ? { ...alert, acknowledged: true, acknowledged_by: data.acknowledged_by, acknowledged_at: data.acknowledged_at }
                  : alert
              ));
            }
          } catch (e) {
            console.log('WebSocket message (non-JSON):', event.data);
          }
        };
        
        ws.onclose = () => {
          console.log('Alert WebSocket disconnected');
          // Reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('Alert WebSocket error:', error);
        };
        
        setWebsocket(ws);
      } catch (error) {
        console.error('Failed to connect to alert WebSocket:', error);
      }
    };

    connectWebSocket();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // Fetch alert data
  useEffect(() => {
    fetchAlertData();
  }, []);

  const fetchAlertData = async () => {
    try {
      setLoading(true);
      
      // Fetch alerts, rules, and summary in parallel
      const [alertsResponse, rulesResponse, summaryResponse] = await Promise.all([
        fetch('/api/alerts/history?limit=50'),
        fetch('/api/alerts/rules'),
        fetch('/api/alerts/summary')
      ]);

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData);
      }

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setAlertRules(rulesData);
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setAlertSummary(summaryData);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch alert data');
      console.error('Error fetching alert data:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alert_id: alertId }),
      });

      if (response.ok) {
        // Update local state
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() }
            : alert
        ));
      } else {
        throw new Error('Failed to acknowledge alert');
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const evaluateAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Alert evaluation result:', result);
        
        // Refresh alert data
        await fetchAlertData();
      } else {
        throw new Error('Failed to evaluate alerts');
      }
    } catch (err) {
      console.error('Error evaluating alerts:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Bell className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Bell className="h-4 w-4 text-blue-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Notifications
            {alertSummary && alertSummary.unacknowledged_alerts > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {alertSummary.unacknowledged_alerts}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={evaluateAlerts}
              className="text-xs"
            >
              Check Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateRule(!showCreateRule)}
              className="text-xs"
            >
              Rules ({alertRules.length})
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Alert Summary */}
        {alertSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{alertSummary.total_alerts}</div>
              <div className="text-xs text-gray-500">Total Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{alertSummary.unacknowledged_alerts}</div>
              <div className="text-xs text-gray-500">Unacknowledged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{alertSummary.acknowledged_alerts}</div>
              <div className="text-xs text-gray-500">Acknowledged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{alertSummary.active_rules}</div>
              <div className="text-xs text-gray-500">Active Rules</div>
            </div>
          </div>
        )}

        {/* Alert List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts to display</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getSeverityColor(alert.alert_level)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.alert_level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{alert.rule_name}</h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                          {alert.alert_level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {alert.triggered_at && formatTimestamp(alert.triggered_at)}
                        </div>
                        {alert.triggered_value && (
                          <div>Value: {alert.triggered_value.toLocaleString()}</div>
                        )}
                        {alert.acknowledged && alert.acknowledged_by && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Acked by {alert.acknowledged_by}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {alert.acknowledged ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Alert Rules Section */}
        {showCreateRule && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Active Alert Rules</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alertRules.map((rule) => (
                <div key={rule.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{rule.rule_name}</span>
                    <span className="text-xs px-2 py-1 bg-white rounded">
                      {rule.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {rule.rule_type} | Cooldown: {rule.cooldown_minutes}min
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertNotificationPanel;