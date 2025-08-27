import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Globe,
  Key,
  LogIn,
  LogOut,
  Settings,
  Eye,
  Download,
  RefreshCw,
  XCircle,
  Info,
  Zap
} from 'lucide-react';

interface AuditEvent {
  id: string;
  event_type: string;
  user_id?: string;
  username?: string;
  ip_address: string;
  user_agent: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  session_id?: string;
}

interface AuditFilters {
  event_type?: string;
  user_id?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  ip_address?: string;
  search?: string;
}

interface AuditStats {
  total_events: number;
  events_today: number;
  failed_logins_today: number;
  unique_users_today: number;
  top_event_types: Array<{ event_type: string; count: number }>;
  severity_breakdown: Record<string, number>;
}

export const AuditLoggingInterface: React.FC = () => {
  const { language, direction } = useLanguage();
  const { user, hasPermission } = useAuth();
  
  // State
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<AuditFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load data
  useEffect(() => {
    if (hasPermission('view_audit_logs')) {
      loadAuditEvents();
      loadAuditStats();
    }
  }, [filters, currentPage]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAuditEvents();
        loadAuditStats();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, filters, currentPage]);

  const loadAuditEvents = async () => {
    if (!hasPermission('view_audit_logs')) {
      setError(language === 'en' 
        ? 'You do not have permission to view audit logs' 
        : 'شما مجوز مشاهده گزارش‌های حسابرسی را ندارید'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await fetch(`/api/oauth2/audit?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuditEvents(data.events || []);
        setTotalPages(data.total_pages || 1);
      } else {
        throw new Error('Failed to load audit events');
      }
    } catch (error) {
      console.error('Failed to load audit events:', error);
      setError(language === 'en' 
        ? 'Failed to load audit events' 
        : 'بارگذاری رویدادهای حسابرسی ناموفق بود'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    try {
      const response = await fetch('/api/oauth2/audit/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuditStats(data);
      }
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  };

  const handleExportAuditLog = async () => {
    if (!hasPermission('export_audit_logs')) {
      setError(language === 'en' 
        ? 'You do not have permission to export audit logs' 
        : 'شما مجوز صادرات گزارش‌های حسابرسی را ندارید'
      );
      return;
    }

    setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        format: 'csv',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      });

      const response = await fetch(`/api/oauth2/audit/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to export audit log');
      }
    } catch (error) {
      setError(language === 'en' 
        ? 'Failed to export audit log' 
        : 'صادرات گزارش حسابرسی ناموفق بود'
      );
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'oauth2_login_success':
      case 'login_success':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'oauth2_login_failed':
      case 'login_failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-blue-600" />;
      case 'token_refresh':
        return <RefreshCw className="h-4 w-4 text-purple-600" />;
      case 'token_revoked':
        return <Key className="h-4 w-4 text-orange-600" />;
      case 'permission_denied':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'settings_changed':
        return <Settings className="h-4 w-4 text-indigo-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(language === 'en' ? 'en-US' : 'fa-IR');
  };

  if (!hasPermission('view_audit_logs')) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'en' ? 'Access Denied' : 'دسترسی مجاز نیست'}
            </h3>
            <p className="text-gray-600">
              {language === 'en' 
                ? 'You do not have permission to view audit logs.' 
                : 'شما مجوز مشاهده گزارش‌های حسابرسی را ندارید.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-100/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {language === 'en' ? 'Security Audit Logs' : 'گزارش‌های حسابرسی امنیتی'}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {language === 'en' 
                    ? 'Monitor and analyze security events and user activities' 
                    : 'نظارت و تحلیل رویدادهای امنیتی و فعالیت‌های کاربری'
                  }
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <Zap className={cn("h-4 w-4", autoRefresh && "animate-pulse")} />
                {language === 'en' ? 'Auto Refresh' : 'تازه‌سازی خودکار'}
              </Button>
              
              <Button
                onClick={handleExportAuditLog}
                disabled={loading || !hasPermission('export_audit_logs')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {language === 'en' ? 'Export' : 'صادرات'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{auditStats.events_today}</p>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Events Today' : 'رویدادهای امروز'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{auditStats.failed_logins_today}</p>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Failed Logins' : 'ورودهای ناموفق'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{auditStats.unique_users_today}</p>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Active Users' : 'کاربران فعال'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{auditStats.total_events}</p>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'Total Events' : 'کل رویدادها'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === 'en' ? 'Filters' : 'فیلترها'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">
                {language === 'en' ? 'Search' : 'جستجو'}
              </Label>
              <Input
                id="search"
                placeholder={language === 'en' ? 'Search events...' : 'جستجوی رویدادها...'}
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="event_type">
                {language === 'en' ? 'Event Type' : 'نوع رویداد'}
              </Label>
              <select
                id="event_type"
                value={filters.event_type || ''}
                onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">
                  {language === 'en' ? 'All Types' : 'همه انواع'}
                </option>
                <option value="oauth2_login_success">OAuth2 Login Success</option>
                <option value="oauth2_login_failed">OAuth2 Login Failed</option>
                <option value="login_success">Login Success</option>
                <option value="login_failed">Login Failed</option>
                <option value="logout">Logout</option>
                <option value="token_refresh">Token Refresh</option>
                <option value="token_revoked">Token Revoked</option>
                <option value="permission_denied">Permission Denied</option>
              </select>
            </div>

            <div>
              <Label htmlFor="severity">
                {language === 'en' ? 'Severity' : 'شدت'}
              </Label>
              <select
                id="severity"
                value={filters.severity || ''}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">
                  {language === 'en' ? 'All Severities' : 'همه شدت‌ها'}
                </option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <Label htmlFor="start_date">
                {language === 'en' ? 'Start Date' : 'تاریخ شروع'}
              </Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setFilters({});
                setCurrentPage(1);
              }}
              variant="outline"
              size="sm"
            >
              {language === 'en' ? 'Clear Filters' : 'پاک کردن فیلترها'}
            </Button>
            <Button
              onClick={() => {
                setCurrentPage(1);
                loadAuditEvents();
              }}
              size="sm"
            >
              {language === 'en' ? 'Apply Filters' : 'اعمال فیلترها'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {language === 'en' ? 'Recent Events' : 'رویدادهای اخیر'}
            </CardTitle>
            <Button
              onClick={loadAuditEvents}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              {language === 'en' ? 'Refresh' : 'تازه‌سازی'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && auditEvents.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">
                {language === 'en' ? 'Loading audit events...' : 'در حال بارگذاری رویدادهای حسابرسی...'}
              </p>
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'en' ? 'No audit events found' : 'رویداد حسابرسی یافت نشد'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getEventIcon(event.event_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {formatEventType(event.event_type)}
                          </h3>
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.action}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{event.username || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span>{event.ip_address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(event.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Page' : 'صفحه'} {currentPage} {language === 'en' ? 'of' : 'از'} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  {language === 'en' ? 'Previous' : 'قبلی'}
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  {language === 'en' ? 'Next' : 'بعدی'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {language === 'en' ? 'Event Details' : 'جزئیات رویداد'}
              </CardTitle>
              <Button
                onClick={() => setSelectedEvent(null)}
                variant="ghost"
                size="sm"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">
                  {language === 'en' ? 'Event Type' : 'نوع رویداد'}
                </Label>
                <p className="text-sm text-gray-600">{formatEventType(selectedEvent.event_type)}</p>
              </div>
              <div>
                <Label className="font-semibold">
                  {language === 'en' ? 'Severity' : 'شدت'}
                </Label>
                <Badge className={getSeverityColor(selectedEvent.severity)}>
                  {selectedEvent.severity}
                </Badge>
              </div>
              <div>
                <Label className="font-semibold">
                  {language === 'en' ? 'User' : 'کاربر'}
                </Label>
                <p className="text-sm text-gray-600">{selectedEvent.username || 'Unknown'}</p>
              </div>
              <div>
                <Label className="font-semibold">
                  {language === 'en' ? 'IP Address' : 'آدرس IP'}
                </Label>
                <p className="text-sm text-gray-600 font-mono">{selectedEvent.ip_address}</p>
              </div>
              <div>
                <Label className="font-semibold">
                  {language === 'en' ? 'Timestamp' : 'زمان'}
                </Label>
                <p className="text-sm text-gray-600">{formatTimestamp(selectedEvent.timestamp)}</p>
              </div>
              <div>
                <Label className="font-semibold">
                  {language === 'en' ? 'Session ID' : 'شناسه جلسه'}
                </Label>
                <p className="text-sm text-gray-600 font-mono">{selectedEvent.session_id || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <Label className="font-semibold">
                {language === 'en' ? 'Action' : 'عمل'}
              </Label>
              <p className="text-sm text-gray-600">{selectedEvent.action}</p>
            </div>

            <div>
              <Label className="font-semibold">
                {language === 'en' ? 'User Agent' : 'مرورگر'}
              </Label>
              <p className="text-xs text-gray-500 break-all">{selectedEvent.user_agent}</p>
            </div>

            {Object.keys(selectedEvent.details).length > 0 && (
              <div>
                <Label className="font-semibold">
                  {language === 'en' ? 'Additional Details' : 'جزئیات اضافی'}
                </Label>
                <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};