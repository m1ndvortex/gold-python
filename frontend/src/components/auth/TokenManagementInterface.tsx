import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { 
  Key, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar,
  Timer,
  Trash2,
  LogOut
} from 'lucide-react';

interface TokenInfo {
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  scopes: string[];
  created_at: string;
  last_refreshed_at?: string;
  refresh_count: number;
}

interface SessionInfo {
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

export const TokenManagementInterface: React.FC = () => {
  const { language } = useLanguage();
  const { logout } = useAuth();
  
  // State
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Load token information
  useEffect(() => {
    loadTokenInfo();
    loadSessions();
    
    // Set up auto-refresh timer
    const interval = setInterval(() => {
      loadTokenInfo();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadTokenInfo = async () => {
    try {
      const response = await fetch('/api/oauth2/token-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTokenInfo(data);
      }
    } catch (error) {
      console.error('Failed to load token info:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/oauth2/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    setError('');
    setSuccess('');

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/oauth2/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update stored tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('token_expiry', (Date.now() + (data.expires_in * 1000)).toString());

      setSuccess(language === 'en' 
        ? 'Tokens refreshed successfully' 
        : 'توکنها با موفقیت تازهسازی شدند'
      );
      
      // Reload token info
      await loadTokenInfo();

    } catch (error) {
      setError(language === 'en' 
        ? `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `تازهسازی توکن ناموفق بود: ${error instanceof Error ? error.message : 'خطای نامشخص'}`
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {language === 'en' ? 'Token Management' : 'مدیریت توکن‌ها'}
          </CardTitle>
          <CardDescription>
            {language === 'en' 
              ? 'Manage your authentication tokens and active sessions'
              : 'مدیریت توکن‌های احراز هویت و جلسات فعال'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Token Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">
              {language === 'en' ? 'Access Token' : 'توکن دسترسی'}
            </h3>
            {tokenInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {language === 'en' ? 'Expires At:' : 'انقضا در:'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tokenInfo.access_token_expires_at).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {language === 'en' ? 'Refresh Count:' : 'تعداد تازه‌سازی:'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tokenInfo.refresh_count}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Loading token information...' : 'بارگذاری اطلاعات توکن...'}
              </p>
            )}
          </div>

          {/* Refresh Token Button */}
          <div className="flex gap-2">
            <Button 
              onClick={handleRefreshToken} 
              disabled={refreshing}
              variant="outline"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {refreshing 
                ? (language === 'en' ? 'Refreshing...' : 'در حال تازه‌سازی...')
                : (language === 'en' ? 'Refresh Token' : 'تازه‌سازی توکن')
              }
            </Button>
          </div>

          {/* Active Sessions */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">
              {language === 'en' ? 'Active Sessions' : 'جلسات فعال'}
            </h3>
            {sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div key={session.session_id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {session.ip_address}
                        </span>
                        {session.is_current && (
                          <Badge variant="default">
                            {language === 'en' ? 'Current' : 'فعلی'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.last_activity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user_agent}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'No active sessions found' : 'هیچ جلسه فعالی یافت نشد'}
              </p>
            )}
          </div>

          {/* Logout */}
          <div className="pt-4 border-t">
            <Button 
              onClick={logout} 
              variant="destructive"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {language === 'en' ? 'Logout' : 'خروج'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenManagementInterface;
