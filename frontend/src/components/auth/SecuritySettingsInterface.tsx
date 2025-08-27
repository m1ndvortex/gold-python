import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { 
  Shield, 
  Settings, 
  Clock,
  Key,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Unlock,
  Timer,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Save,
  RotateCcw,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';

interface SecuritySettings {
  // Token Settings
  access_token_lifetime: number; // minutes
  refresh_token_lifetime: number; // days
  token_rotation_enabled: boolean;
  automatic_token_refresh: boolean;
  
  // Session Settings
  session_timeout: number; // minutes
  concurrent_sessions_limit: number;
  session_activity_tracking: boolean;
  force_logout_on_password_change: boolean;
  
  // Security Policies
  require_mfa: boolean;
  password_expiry_days: number;
  login_attempt_limit: number;
  account_lockout_duration: number; // minutes
  
  // Audit Settings
  audit_login_events: boolean;
  audit_permission_changes: boolean;
  audit_data_access: boolean;
  audit_retention_days: number;
  
  // Device Management
  remember_device_enabled: boolean;
  device_trust_duration: number; // days
  max_trusted_devices: number;
  
  // API Security
  api_rate_limiting: boolean;
  api_requests_per_minute: number;
  api_key_rotation_days: number;
}

interface DeviceInfo {
  id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip_address: string;
  last_used: string;
  is_current: boolean;
  is_trusted: boolean;
}

export const SecuritySettingsInterface: React.FC = () => {
  const { language, direction } = useLanguage();
  const { user, hasPermission } = useAuth();
  
  // State
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'sessions' | 'security' | 'audit' | 'devices'>('tokens');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load data
  useEffect(() => {
    if (hasPermission('manage_security_settings')) {
      loadSecuritySettings();
      loadTrustedDevices();
    }
  }, []);

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/oauth2/security-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        throw new Error('Failed to load security settings');
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
      setError(language === 'en' 
        ? 'Failed to load security settings' 
        : 'بارگذاری تنظیمات امنیتی ناموفق بود'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTrustedDevices = async () => {
    try {
      const response = await fetch('/api/oauth2/trusted-devices', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Failed to load trusted devices:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings || !hasPermission('manage_security_settings')) {
      setError(language === 'en' 
        ? 'You do not have permission to modify security settings' 
        : 'شما مجوز تغییر تنظیمات امنیتی را ندارید'
      );
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/oauth2/security-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSuccess(language === 'en' 
          ? 'Security settings updated successfully' 
          : 'تنظیمات امنیتی با موفقیت به‌روزرسانی شد'
        );
      } else {
        throw new Error('Failed to update security settings');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to update security settings: ${error}` 
        : `به‌روزرسانی تنظیمات امنیتی ناموفق بود: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!hasPermission('manage_security_settings')) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/oauth2/security-settings/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setSuccess(language === 'en' 
          ? 'Settings reset to defaults' 
          : 'تنظیمات به حالت پیش‌فرض بازگردانده شد'
        );
      } else {
        throw new Error('Failed to reset settings');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to reset settings: ${error}` 
        : `بازگردانی تنظیمات ناموفق بود: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/oauth2/trusted-devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setSuccess(language === 'en' 
          ? 'Device access revoked successfully' 
          : 'دسترسی دستگاه با موفقیت لغو شد'
        );
        await loadTrustedDevices();
      } else {
        throw new Error('Failed to revoke device access');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to revoke device access: ${error}` 
        : `لغو دسترسی دستگاه ناموفق بود: ${error}`
      );
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-blue-600" />;
      case 'tablet':
        return <Smartphone className="h-5 w-5 text-green-600" />;
      case 'desktop':
      default:
        return <Monitor className="h-5 w-5 text-purple-600" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} ${language === 'en' ? 'minutes' : 'دقیقه'}`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours} ${language === 'en' ? 'hours' : 'ساعت'}`;
  };

  const formatDays = (days: number) => {
    return `${days} ${language === 'en' ? 'days' : 'روز'}`;
  };

  if (!hasPermission('manage_security_settings')) {
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
                ? 'You do not have permission to manage security settings.' 
                : 'شما مجوز مدیریت تنظیمات امنیتی را ندارید.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading && !settings) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <p className="text-gray-600">
              {language === 'en' ? 'Loading security settings...' : 'در حال بارگذاری تنظیمات امنیتی...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-100/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {language === 'en' ? 'Security Settings' : 'تنظیمات امنیتی'}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {language === 'en' 
                    ? 'Configure authentication, sessions, and security policies' 
                    : 'پیکربندی احراز هویت، جلسات و سیاست‌های امنیتی'
                  }
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showAdvanced 
                  ? (language === 'en' ? 'Hide Advanced' : 'مخفی کردن پیشرفته')
                  : (language === 'en' ? 'Show Advanced' : 'نمایش پیشرفته')
                }
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

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'tokens', label: language === 'en' ? 'Tokens' : 'توکن‌ها', icon: Key },
          { id: 'sessions', label: language === 'en' ? 'Sessions' : 'جلسات', icon: Clock },
          { id: 'security', label: language === 'en' ? 'Security' : 'امنیت', icon: Shield },
          { id: 'audit', label: language === 'en' ? 'Audit' : 'حسابرسی', icon: Eye },
          { id: 'devices', label: language === 'en' ? 'Devices' : 'دستگاه‌ها', icon: Monitor }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white shadow-sm text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {settings && (
        <>
          {/* Token Settings */}
          {activeTab === 'tokens' && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {language === 'en' ? 'Token Configuration' : 'پیکربندی توکن'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Configure OAuth2 token lifetimes and behavior' 
                    : 'پیکربندی مدت زمان و رفتار توکن‌های OAuth2'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Access Token Lifetime' : 'مدت زمان توکن دسترسی'}
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">
                        {formatDuration(settings.access_token_lifetime)}
                      </p>
                      <Slider
                        value={[settings.access_token_lifetime]}
                        onValueChange={([value]) => setSettings({...settings, access_token_lifetime: value})}
                        min={5}
                        max={60}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5 min</span>
                        <span>60 min</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Refresh Token Lifetime' : 'مدت زمان توکن تازه‌سازی'}
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">
                        {formatDays(settings.refresh_token_lifetime)}
                      </p>
                      <Slider
                        value={[settings.refresh_token_lifetime]}
                        onValueChange={([value]) => setSettings({...settings, refresh_token_lifetime: value})}
                        min={1}
                        max={90}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 day</span>
                        <span>90 days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Token Rotation' : 'چرخش توکن'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Automatically rotate refresh tokens on use' 
                            : 'چرخش خودکار توکن‌های تازه‌سازی در هنگام استفاده'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.token_rotation_enabled}
                        onCheckedChange={(checked) => setSettings({...settings, token_rotation_enabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Automatic Refresh' : 'تازه‌سازی خودکار'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Automatically refresh tokens before expiry' 
                            : 'تازه‌سازی خودکار توکن‌ها قبل از انقضا'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.automatic_token_refresh}
                        onCheckedChange={(checked) => setSettings({...settings, automatic_token_refresh: checked})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Settings */}
          {activeTab === 'sessions' && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {language === 'en' ? 'Session Management' : 'مدیریت جلسات'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Configure user session behavior and limits' 
                    : 'پیکربندی رفتار و محدودیت‌های جلسه کاربری'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Session Timeout' : 'زمان انقضای جلسه'}
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">
                        {formatDuration(settings.session_timeout)}
                      </p>
                      <Slider
                        value={[settings.session_timeout]}
                        onValueChange={([value]) => setSettings({...settings, session_timeout: value})}
                        min={15}
                        max={480}
                        step={15}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>15 min</span>
                        <span>8 hours</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Concurrent Sessions Limit' : 'محدودیت جلسات همزمان'}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.concurrent_sessions_limit}
                        onChange={(e) => setSettings({...settings, concurrent_sessions_limit: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Activity Tracking' : 'ردیابی فعالیت'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Track user activity for session management' 
                            : 'ردیابی فعالیت کاربر برای مدیریت جلسه'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.session_activity_tracking}
                        onCheckedChange={(checked) => setSettings({...settings, session_activity_tracking: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Force Logout on Password Change' : 'خروج اجباری در تغییر رمز'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Log out all sessions when password changes' 
                            : 'خروج از تمام جلسات هنگام تغییر رمز عبور'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.force_logout_on_password_change}
                        onCheckedChange={(checked) => setSettings({...settings, force_logout_on_password_change: checked})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Policies */}
          {activeTab === 'security' && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {language === 'en' ? 'Security Policies' : 'سیاست‌های امنیتی'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Configure authentication and access control policies' 
                    : 'پیکربندی سیاست‌های احراز هویت و کنترل دسترسی'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Require MFA' : 'الزام احراز هویت چندعاملی'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Require multi-factor authentication for all users' 
                            : 'الزام احراز هویت چندعاملی برای همه کاربران'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.require_mfa}
                        onCheckedChange={(checked) => setSettings({...settings, require_mfa: checked})}
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Password Expiry (Days)' : 'انقضای رمز عبور (روز)'}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        value={settings.password_expiry_days}
                        onChange={(e) => setSettings({...settings, password_expiry_days: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'en' ? 'Set to 0 to disable password expiry' : 'برای غیرفعال کردن انقضای رمز، مقدار 0 را وارد کنید'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Login Attempt Limit' : 'محدودیت تلاش ورود'}
                      </Label>
                      <Input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.login_attempt_limit}
                        onChange={(e) => setSettings({...settings, login_attempt_limit: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Account Lockout Duration (Minutes)' : 'مدت قفل حساب (دقیقه)'}
                      </Label>
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        value={settings.account_lockout_duration}
                        onChange={(e) => setSettings({...settings, account_lockout_duration: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Settings */}
          {activeTab === 'audit' && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {language === 'en' ? 'Audit Configuration' : 'پیکربندی حسابرسی'}
                </CardTitle>
                <CardDescription>
                  {language === 'en' 
                    ? 'Configure audit logging and retention policies' 
                    : 'پیکربندی گزارش‌گیری حسابرسی و سیاست‌های نگهداری'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Audit Login Events' : 'حسابرسی رویدادهای ورود'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Log all login attempts and sessions' 
                            : 'ثبت تمام تلاش‌های ورود و جلسات'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.audit_login_events}
                        onCheckedChange={(checked) => setSettings({...settings, audit_login_events: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Audit Permission Changes' : 'حسابرسی تغییرات مجوز'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Log all permission and role changes' 
                            : 'ثبت تمام تغییرات مجوز و نقش'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.audit_permission_changes}
                        onCheckedChange={(checked) => setSettings({...settings, audit_permission_changes: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Audit Data Access' : 'حسابرسی دسترسی داده'}
                        </Label>
                        <p className="text-sm text-gray-600">
                          {language === 'en' 
                            ? 'Log sensitive data access and modifications' 
                            : 'ثبت دسترسی و تغییرات داده‌های حساس'
                          }
                        </p>
                      </div>
                      <Switch
                        checked={settings.audit_data_access}
                        onCheckedChange={(checked) => setSettings({...settings, audit_data_access: checked})}
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium">
                        {language === 'en' ? 'Audit Retention (Days)' : 'نگهداری حسابرسی (روز)'}
                      </Label>
                      <Input
                        type="number"
                        min="30"
                        max="2555"
                        value={settings.audit_retention_days}
                        onChange={(e) => setSettings({...settings, audit_retention_days: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Device Management */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    {language === 'en' ? 'Device Management' : 'مدیریت دستگاه‌ها'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'en' 
                      ? 'Configure trusted device settings and manage device access' 
                      : 'پیکربندی تنظیمات دستگاه‌های مورد اعتماد و مدیریت دسترسی دستگاه'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="text-base font-medium">
                            {language === 'en' ? 'Remember Device' : 'به خاطر سپردن دستگاه'}
                          </Label>
                          <p className="text-sm text-gray-600">
                            {language === 'en' 
                              ? 'Allow users to mark devices as trusted' 
                              : 'اجازه علامت‌گذاری دستگاه‌ها به عنوان مورد اعتماد'
                            }
                          </p>
                        </div>
                        <Switch
                          checked={settings.remember_device_enabled}
                          onCheckedChange={(checked) => setSettings({...settings, remember_device_enabled: checked})}
                        />
                      </div>

                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Device Trust Duration (Days)' : 'مدت اعتماد دستگاه (روز)'}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={settings.device_trust_duration}
                          onChange={(e) => setSettings({...settings, device_trust_duration: parseInt(e.target.value)})}
                          className="mt-2"
                          disabled={!settings.remember_device_enabled}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          {language === 'en' ? 'Max Trusted Devices' : 'حداکثر دستگاه‌های مورد اعتماد'}
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.max_trusted_devices}
                          onChange={(e) => setSettings({...settings, max_trusted_devices: parseInt(e.target.value)})}
                          className="mt-2"
                          disabled={!settings.remember_device_enabled}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trusted Devices List */}
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    {language === 'en' ? 'Trusted Devices' : 'دستگاه‌های مورد اعتماد'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {devices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{language === 'en' ? 'No trusted devices found' : 'دستگاه مورد اعتمادی یافت نشد'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-4">
                            {getDeviceIcon(device.device_type)}
                            <div>
                              <h3 className="font-semibold text-gray-900">{device.device_name}</h3>
                              <p className="text-sm text-gray-600">{device.browser} on {device.os}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <span>{device.ip_address}</span>
                                <span>
                                  {language === 'en' ? 'Last used:' : 'آخرین استفاده:'} {' '}
                                  {new Date(device.last_used).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {device.is_current && (
                              <Badge variant="outline" className="border-green-500 text-green-700">
                                {language === 'en' ? 'Current' : 'فعلی'}
                              </Badge>
                            )}
                            {device.is_trusted && (
                              <Badge className="bg-blue-100 text-blue-800">
                                {language === 'en' ? 'Trusted' : 'مورد اعتماد'}
                              </Badge>
                            )}
                            {!device.is_current && (
                              <Button
                                onClick={() => handleRevokeDevice(device.id)}
                                disabled={loading}
                                variant="destructive"
                                size="sm"
                              >
                                {language === 'en' ? 'Revoke' : 'لغو'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {language === 'en' ? 'Saving...' : 'در حال ذخیره...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {language === 'en' ? 'Save Settings' : 'ذخیره تنظیمات'}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleResetToDefaults}
                    disabled={saving}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {language === 'en' ? 'Reset to Defaults' : 'بازگردانی به پیش‌فرض'}
                  </Button>
                </div>

                <div className="text-sm text-gray-500">
                  {language === 'en' 
                    ? 'Changes will take effect immediately for new sessions' 
                    : 'تغییرات بلافاصله برای جلسات جدید اعمال خواهد شد'
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};