import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { 
  Shield, 
  User, 
  Key,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Info,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  QrCode,
  Copy,
  RefreshCw,
  Save,
  Mail,
  Phone,
  Calendar,
  Globe,
  Clock,
  Settings,
  Trash2,
  Plus
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
  };
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

interface MFASettings {
  enabled: boolean;
  methods: MFAMethod[];
  backup_codes: string[];
  recovery_email?: string;
  recovery_phone?: string;
}

interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'backup_codes';
  name: string;
  enabled: boolean;
  verified: boolean;
  created_at: string;
  last_used?: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  description: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const UserProfileSecurityInterface: React.FC = () => {
  const { language, direction } = useLanguage();
  const { user, logout } = useAuth();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mfaSettings, setMfaSettings] = useState<MFASettings | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'mfa' | 'activity'>('profile');
  
  // Password change state
  const [passwordChange, setPasswordChange] = useState<PasswordChangeRequest>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // MFA setup state
  const [mfaSetup, setMfaSetup] = useState({
    showQR: false,
    qrCode: '',
    secret: '',
    verificationCode: '',
    backupCodes: [] as string[]
  });

  // Load data
  useEffect(() => {
    loadUserProfile();
    loadMFASettings();
    loadSecurityEvents();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else {
        throw new Error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setError(language === 'en' 
        ? 'Failed to load user profile' 
        : 'بارگذاری پروفایل کاربری ناموفق بود'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMFASettings = async () => {
    try {
      const response = await fetch('/api/auth/mfa', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMfaSettings(data.mfa_settings);
      }
    } catch (error) {
      console.error('Failed to load MFA settings:', error);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const response = await fetch('/api/auth/security-events?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to load security events:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordChange.new_password !== passwordChange.confirm_password) {
      setError(language === 'en' 
        ? 'New passwords do not match' 
        : 'رمزهای عبور جدید مطابقت ندارند'
      );
      return;
    }

    if (passwordChange.new_password.length < 8) {
      setError(language === 'en' 
        ? 'Password must be at least 8 characters long' 
        : 'رمز عبور باید حداقل ۸ کاراکتر باشد'
      );
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_password: passwordChange.current_password,
          new_password: passwordChange.new_password
        })
      });

      if (response.ok) {
        setSuccess(language === 'en' 
          ? 'Password changed successfully' 
          : 'رمز عبور با موفقیت تغییر یافت'
        );
        setPasswordChange({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to change password: ${error}` 
        : `تغییر رمز عبور ناموفق بود: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetupTOTP = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/totp/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMfaSetup({
          ...mfaSetup,
          showQR: true,
          qrCode: data.qr_code,
          secret: data.secret
        });
      } else {
        throw new Error('Failed to setup TOTP');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to setup TOTP: ${error}` 
        : `راه‌اندازی TOTP ناموفق بود: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (!mfaSetup.verificationCode) {
      setError(language === 'en' 
        ? 'Please enter verification code' 
        : 'لطفا کد تأیید را وارد کنید'
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/totp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          code: mfaSetup.verificationCode,
          secret: mfaSetup.secret
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMfaSetup({
          ...mfaSetup,
          backupCodes: data.backup_codes,
          showQR: false,
          verificationCode: ''
        });
        setSuccess(language === 'en' 
          ? 'TOTP authentication enabled successfully' 
          : 'احراز هویت TOTP با موفقیت فعال شد'
        );
        await loadMFASettings();
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Verification failed: ${error}` 
        : `تأیید ناموفق بود: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDisableMFA = async (methodId: string) => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/auth/mfa/${methodId}/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        setSuccess(language === 'en' 
          ? 'MFA method disabled successfully' 
          : 'روش احراز هویت چندعاملی با موفقیت غیرفعال شد'
        );
        await loadMFASettings();
      } else {
        throw new Error('Failed to disable MFA method');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to disable MFA: ${error}` 
        : `غیرفعال کردن MFA ناموفق بود: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/backup-codes/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMfaSetup({
          ...mfaSetup,
          backupCodes: data.backup_codes
        });
        setSuccess(language === 'en' 
          ? 'New backup codes generated' 
          : 'کدهای پشتیبان جدید تولید شد'
        );
        await loadMFASettings();
      } else {
        throw new Error('Failed to generate backup codes');
      }
    } catch (error) {
      setError(language === 'en' 
        ? `Failed to generate backup codes: ${error}` 
        : `تولید کدهای پشتیبان ناموفق بود: ${error}`
      );
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(language === 'en' 
      ? 'Copied to clipboard' 
      : 'در کلیپ‌بورد کپی شد'
    );
  };

  const getMFAMethodIcon = (type: string) => {
    switch (type) {
      case 'totp':
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      case 'sms':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-600" />;
      case 'backup_codes':
        return <Key className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSecurityEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'login_failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'password_changed':
        return <Key className="h-4 w-4 text-blue-600" />;
      case 'mfa_enabled':
      case 'mfa_disabled':
        return <Shield className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && !profile) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <User className="h-6 w-6 text-white" />
            </div>
            <p className="text-gray-600">
              {language === 'en' ? 'Loading user profile...' : 'در حال بارگذاری پروفایل کاربری...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100/50">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
              {profile?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {profile?.full_name || profile?.username}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {profile?.email} • {profile?.role.name}
              </CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={profile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {profile?.is_active 
                    ? (language === 'en' ? 'Active' : 'فعال')
                    : (language === 'en' ? 'Inactive' : 'غیرفعال')
                  }
                </Badge>
                {mfaSettings?.enabled && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Shield className="h-3 w-3 mr-1" />
                    {language === 'en' ? 'MFA Enabled' : 'MFA فعال'}
                  </Badge>
                )}
              </div>
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
          { id: 'profile', label: language === 'en' ? 'Profile' : 'پروفایل', icon: User },
          { id: 'security', label: language === 'en' ? 'Security' : 'امنیت', icon: Lock },
          { id: 'mfa', label: language === 'en' ? 'Two-Factor Auth' : 'احراز دوعاملی', icon: Shield },
          { id: 'activity', label: language === 'en' ? 'Activity' : 'فعالیت', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {language === 'en' ? 'Profile Information' : 'اطلاعات پروفایل'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {language === 'en' ? 'Username' : 'نام کاربری'}
                  </Label>
                  <p className="text-gray-700 mt-1">{profile.username}</p>
                </div>
                
                <div>
                  <Label className="text-base font-medium">
                    {language === 'en' ? 'Email' : 'ایمیل'}
                  </Label>
                  <p className="text-gray-700 mt-1">{profile.email}</p>
                </div>

                {profile.phone && (
                  <div>
                    <Label className="text-base font-medium">
                      {language === 'en' ? 'Phone' : 'تلفن'}
                    </Label>
                    <p className="text-gray-700 mt-1">{profile.phone}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {language === 'en' ? 'Role' : 'نقش'}
                  </Label>
                  <p className="text-gray-700 mt-1">{profile.role.name}</p>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    {language === 'en' ? 'Member Since' : 'عضو از'}
                  </Label>
                  <p className="text-gray-700 mt-1">
                    {new Date(profile.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}
                  </p>
                </div>

                {profile.last_login && (
                  <div>
                    <Label className="text-base font-medium">
                      {language === 'en' ? 'Last Login' : 'آخرین ورود'}
                    </Label>
                    <p className="text-gray-700 mt-1">
                      {new Date(profile.last_login).toLocaleString(language === 'en' ? 'en-US' : 'fa-IR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {language === 'en' ? 'Security Settings' : 'تنظیمات امنیتی'}
            </CardTitle>
            <CardDescription>
              {language === 'en' 
                ? 'Manage your password and security preferences' 
                : 'مدیریت رمز عبور و تنظیمات امنیتی شما'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Change */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'en' ? 'Change Password' : 'تغییر رمز عبور'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_password">
                    {language === 'en' ? 'Current Password' : 'رمز عبور فعلی'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordChange.current_password}
                      onChange={(e) => setPasswordChange({...passwordChange, current_password: e.target.value})}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new_password">
                    {language === 'en' ? 'New Password' : 'رمز عبور جدید'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordChange.new_password}
                      onChange={(e) => setPasswordChange({...passwordChange, new_password: e.target.value})}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="confirm_password">
                    {language === 'en' ? 'Confirm New Password' : 'تأیید رمز عبور جدید'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordChange.confirm_password}
                      onChange={(e) => setPasswordChange({...passwordChange, confirm_password: e.target.value})}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={saving || !passwordChange.current_password || !passwordChange.new_password || !passwordChange.confirm_password}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {language === 'en' ? 'Changing...' : 'در حال تغییر...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {language === 'en' ? 'Change Password' : 'تغییر رمز عبور'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MFA Tab */}
      {activeTab === 'mfa' && mfaSettings && (
        <div className="space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {language === 'en' ? 'Two-Factor Authentication' : 'احراز هویت دوعاملی'}
              </CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Add an extra layer of security to your account' 
                  : 'لایه امنیتی اضافی به حساب خود اضافه کنید'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MFA Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {language === 'en' ? 'Two-Factor Authentication' : 'احراز هویت دوعاملی'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {mfaSettings.enabled 
                      ? (language === 'en' ? 'Your account is protected with 2FA' : 'حساب شما با 2FA محافظت می‌شود')
                      : (language === 'en' ? 'Add extra security to your account' : 'امنیت اضافی به حساب خود اضافه کنید')
                    }
                  </p>
                </div>
                <Badge className={mfaSettings.enabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {mfaSettings.enabled 
                    ? (language === 'en' ? 'Enabled' : 'فعال')
                    : (language === 'en' ? 'Disabled' : 'غیرفعال')
                  }
                </Badge>
              </div>

              {/* MFA Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {language === 'en' ? 'Authentication Methods' : 'روش‌های احراز هویت'}
                </h3>

                {mfaSettings.methods.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === 'en' ? 'No authentication methods configured' : 'هیچ روش احراز هویتی پیکربندی نشده'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mfaSettings.methods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {getMFAMethodIcon(method.type)}
                          <div>
                            <h4 className="font-medium text-gray-900">{method.name}</h4>
                            <p className="text-sm text-gray-600">
                              {method.verified 
                                ? (language === 'en' ? 'Verified' : 'تأیید شده')
                                : (language === 'en' ? 'Not verified' : 'تأیید نشده')
                              }
                              {method.last_used && (
                                <span className="ml-2">
                                  • {language === 'en' ? 'Last used:' : 'آخرین استفاده:'} {' '}
                                  {new Date(method.last_used).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={method.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {method.enabled 
                              ? (language === 'en' ? 'Active' : 'فعال')
                              : (language === 'en' ? 'Inactive' : 'غیرفعال')
                            }
                          </Badge>
                          <Button
                            onClick={() => handleDisableMFA(method.id)}
                            disabled={saving}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add TOTP */}
                {!mfaSettings.methods.some(m => m.type === 'totp' && m.enabled) && (
                  <div className="space-y-4">
                    <Button
                      onClick={handleSetupTOTP}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {language === 'en' ? 'Add Authenticator App' : 'افزودن برنامه احراز هویت'}
                    </Button>

                    {/* TOTP Setup */}
                    {mfaSetup.showQR && (
                      <Card className="border-2 border-blue-200">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {language === 'en' ? 'Setup Authenticator App' : 'راه‌اندازی برنامه احراز هویت'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-center">
                            <div className="bg-white p-4 rounded-lg border inline-block">
                              <img src={mfaSetup.qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {language === 'en' 
                                ? 'Scan this QR code with your authenticator app' 
                                : 'این کد QR را با برنامه احراز هویت خود اسکن کنید'
                              }
                            </p>
                          </div>

                          <div>
                            <Label>
                              {language === 'en' ? 'Or enter this secret manually:' : 'یا این رمز را به صورت دستی وارد کنید:'}
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input value={mfaSetup.secret} readOnly className="font-mono" />
                              <Button
                                onClick={() => copyToClipboard(mfaSetup.secret)}
                                variant="outline"
                                size="sm"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="verification_code">
                              {language === 'en' ? 'Enter verification code from your app:' : 'کد تأیید از برنامه خود را وارد کنید:'}
                            </Label>
                            <Input
                              id="verification_code"
                              value={mfaSetup.verificationCode}
                              onChange={(e) => setMfaSetup({...mfaSetup, verificationCode: e.target.value})}
                              placeholder="000000"
                              className="font-mono text-center text-lg"
                              maxLength={6}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleVerifyTOTP}
                              disabled={saving || !mfaSetup.verificationCode}
                              className="flex-1"
                            >
                              {saving ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                  {language === 'en' ? 'Verifying...' : 'در حال تأیید...'}
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {language === 'en' ? 'Verify & Enable' : 'تأیید و فعال‌سازی'}
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => setMfaSetup({...mfaSetup, showQR: false, verificationCode: ''})}
                              variant="outline"
                            >
                              {language === 'en' ? 'Cancel' : 'لغو'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Backup Codes */}
                {mfaSettings.enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {language === 'en' ? 'Backup Codes' : 'کدهای پشتیبان'}
                      </h3>
                      <Button
                        onClick={handleGenerateBackupCodes}
                        disabled={saving}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {language === 'en' ? 'Generate New' : 'تولید جدید'}
                      </Button>
                    </div>

                    {(mfaSetup.backupCodes.length > 0 || mfaSettings.backup_codes.length > 0) && (
                      <Card className="border-2 border-yellow-200 bg-yellow-50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                              <p className="font-medium mb-1">
                                {language === 'en' ? 'Important: Save these backup codes' : 'مهم: این کدهای پشتیبان را ذخیره کنید'}
                              </p>
                              <p>
                                {language === 'en' 
                                  ? 'Use these codes to access your account if you lose your authenticator device.' 
                                  : 'در صورت از دست دادن دستگاه احراز هویت، از این کدها برای دسترسی به حساب خود استفاده کنید.'
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {(mfaSetup.backupCodes.length > 0 ? mfaSetup.backupCodes : mfaSettings.backup_codes).map((code, index) => (
                              <div key={index} className="bg-white p-2 rounded border font-mono text-sm text-center">
                                {code}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {language === 'en' ? 'Recent Security Activity' : 'فعالیت‌های امنیتی اخیر'}
            </CardTitle>
            <CardDescription>
              {language === 'en' 
                ? 'Monitor recent security events on your account' 
                : 'نظارت بر رویدادهای امنیتی اخیر حساب شما'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {securityEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'en' ? 'No recent security events' : 'رویداد امنیتی اخیری وجود ندارد'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                    {getSecurityEventIcon(event.event_type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{event.description}</h4>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {event.ip_address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.timestamp).toLocaleString(language === 'en' ? 'en-US' : 'fa-IR')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 break-all">{event.user_agent}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};