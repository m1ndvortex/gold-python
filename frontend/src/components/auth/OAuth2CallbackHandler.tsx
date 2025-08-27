import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Shield,
  Key
} from 'lucide-react';

interface OAuth2CallbackState {
  timestamp: number;
  provider: string;
  redirect: string;
}

export const OAuth2CallbackHandler: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    handleOAuth2Callback();
  }, []);

  const handleOAuth2Callback = async () => {
    try {
      // Extract parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth2 errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      setProgress(25);
      setMessage(language === 'en' 
        ? 'Validating authorization...' 
        : 'در حال اعتبارسنجی مجوز...'
      );

      // Validate state parameter
      const storedState = sessionStorage.getItem('oauth2_state');
      const storedProvider = sessionStorage.getItem('oauth2_provider');

      if (!storedState || storedState !== state) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      if (!storedProvider) {
        throw new Error('Missing provider information');
      }

      // Parse state to get provider and redirect info
      let callbackState: OAuth2CallbackState;
      try {
        callbackState = JSON.parse(atob(state));
      } catch {
        throw new Error('Invalid state format');
      }

      setProgress(50);
      setMessage(language === 'en' 
        ? 'Exchanging authorization code...' 
        : 'در حال تبادل کد مجوز...'
      );

      // Exchange authorization code for tokens
      const tokenResponse = await fetch('/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `${window.location.origin}/auth/callback`,
          provider: callbackState.provider,
          state: state
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.detail || 'Token exchange failed');
      }

      const tokenData = await tokenResponse.json();

      setProgress(75);
      setMessage(language === 'en' 
        ? 'Validating user information...' 
        : 'در حال اعتبارسنجی اطلاعات کاربر...'
      );

      // Store tokens
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);
      localStorage.setItem('token_expiry', (Date.now() + (tokenData.expires_in * 1000)).toString());
      localStorage.setItem('token_type', tokenData.token_type || 'Bearer');

      // Store OAuth2 specific information
      localStorage.setItem('oauth2_provider', callbackState.provider);
      localStorage.setItem('oauth2_scopes', JSON.stringify(tokenData.scope?.split(' ') || []));

      setProgress(90);
      setMessage(language === 'en' 
        ? 'Completing authentication...' 
        : 'در حال تکمیل احراز هویت...'
      );

      // Get user information
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `${tokenData.token_type || 'Bearer'} ${tokenData.access_token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }

      const userData = await userResponse.json();

      // Store user information
      localStorage.setItem('user_info', JSON.stringify(userData));

      setProgress(100);
      setStatus('success');
      setMessage(language === 'en' 
        ? 'Authentication successful! Redirecting...' 
        : 'احراز هویت موفق! در حال انتقال...'
      );

      // Clean up session storage
      sessionStorage.removeItem('oauth2_state');
      sessionStorage.removeItem('oauth2_provider');

      // Log successful authentication
      await logAuthenticationEvent('oauth2_login_success', {
        provider: callbackState.provider,
        user_id: userData.id,
        timestamp: new Date().toISOString()
      });

      // Redirect to intended page or dashboard
      setTimeout(() => {
        const redirectPath = callbackState.redirect && callbackState.redirect !== '/login' 
          ? callbackState.redirect 
          : '/';
        navigate(redirectPath, { replace: true });
      }, 1500);

    } catch (error) {
      console.error('OAuth2 callback error:', error);
      
      setStatus('error');
      setMessage(getErrorMessage(error));

      // Log failed authentication
      await logAuthenticationEvent('oauth2_login_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      // Clean up session storage
      sessionStorage.removeItem('oauth2_state');
      sessionStorage.removeItem('oauth2_provider');

      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 5000);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (!error) return '';

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Map common OAuth2 errors to user-friendly messages
    if (errorMessage.includes('access_denied')) {
      return language === 'en' 
        ? 'Access was denied. Please try again and grant the required permissions.' 
        : 'دسترسی رد شد. لطفا دوباره تلاش کنید و مجوزهای لازم را اعطا کنید.';
    }

    if (errorMessage.includes('invalid_request')) {
      return language === 'en' 
        ? 'Invalid authentication request. Please try again.' 
        : 'درخواست احراز هویت نامعتبر. لطفا دوباره تلاش کنید.';
    }

    if (errorMessage.includes('invalid_client')) {
      return language === 'en' 
        ? 'Authentication service configuration error. Please contact support.' 
        : 'خطای پیکربندی سرویس احراز هویت. لطفا با پشتیبانی تماس بگیرید.';
    }

    if (errorMessage.includes('invalid_grant')) {
      return language === 'en' 
        ? 'Authentication grant expired. Please try again.' 
        : 'مجوز احراز هویت منقضی شده. لطفا دوباره تلاش کنید.';
    }

    if (errorMessage.includes('CSRF')) {
      return language === 'en' 
        ? 'Security validation failed. Please try again.' 
        : 'اعتبارسنجی امنیتی ناموفق بود. لطفا دوباره تلاش کنید.';
    }

    // Default error message
    return language === 'en' 
      ? `Authentication failed: ${errorMessage}` 
      : `احراز هویت ناموفق بود: ${errorMessage}`;
  };

  const logAuthenticationEvent = async (eventType: string, data: any) => {
    try {
      await fetch('/api/oauth2/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventType,
          data: data,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to log authentication event:', error);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/utils/client-ip');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'from-blue-500 to-indigo-600';
      case 'success':
        return 'from-green-500 to-teal-600';
      case 'error':
        return 'from-red-500 to-pink-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 py-12 px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-teal-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <Card className="max-w-md w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
        <CardContent className="py-12 px-8">
          <div className="text-center space-y-6">
            {/* Status Icon */}
            <div className="flex items-center justify-center">
              <div className={`h-16 w-16 bg-gradient-to-br ${getStatusColor()} rounded-3xl flex items-center justify-center shadow-lg`}>
                {getStatusIcon()}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                {language === 'en' ? 'Secure Authentication' : 'احراز هویت امن'}
              </h2>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>OAuth2 Protocol</span>
              </div>
            </div>

            {/* Progress Bar */}
            {status === 'processing' && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{progress}%</p>
              </div>
            )}

            {/* Status Message */}
            <div className="space-y-4">
              <p className="text-gray-700 font-medium">{message}</p>
              
              {status === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {language === 'en' 
                      ? 'You will be redirected to the login page in a few seconds.' 
                      : 'در چند ثانیه به صفحه ورود منتقل خواهید شد.'
                    }
                  </AlertDescription>
                </Alert>
              )}

              {status === 'success' && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-green-600" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium">
                        {language === 'en' ? 'Authentication Complete' : 'احراز هویت تکمیل شد'}
                      </p>
                      <p>
                        {language === 'en' 
                          ? 'Your secure session has been established.' 
                          : 'جلسه امن شما برقرار شده است.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Loading Animation */}
            {status === 'processing' && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};