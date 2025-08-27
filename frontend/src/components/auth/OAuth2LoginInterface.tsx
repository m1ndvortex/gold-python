import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';
import { 
  Shield, 
  Key, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Globe,
  Server
} from 'lucide-react';

interface OAuth2Provider {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  description: string;
  authUrl: string;
  isEnabled: boolean;
  isConfigured: boolean;
  scopes: string[];
}

interface OAuth2LoginInterfaceProps {
  onProviderSelect?: (provider: OAuth2Provider) => void;
  onTraditionalLogin?: () => void;
  className?: string;
}

export const OAuth2LoginInterface: React.FC<OAuth2LoginInterfaceProps> = ({
  onProviderSelect,
  onTraditionalLogin,
  className
}) => {
  const { language, direction } = useLanguage();
  
  // State
  const [providers, setProviders] = useState<OAuth2Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load OAuth2 providers
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/oauth2/providers');
      
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      } else {
        throw new Error('Failed to load OAuth2 providers');
      }
    } catch (error) {
      console.error('Failed to load OAuth2 providers:', error);
      setError(language === 'en' 
        ? 'Failed to load authentication providers' 
        : 'بارگذاری ارائه‌دهندگان احراز هویت ناموفق بود'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: OAuth2Provider) => {
    if (!provider.isEnabled || !provider.isConfigured) {
      setError(language === 'en' 
        ? 'This authentication provider is not available' 
        : 'این ارائه‌دهنده احراز هویت در دسترس نیست'
      );
      return;
    }

    setIsAuthenticating(true);
    setSelectedProvider(provider.id);
    setError('');

    try {
      // Generate state parameter for CSRF protection
      const state = btoa(JSON.stringify({
        timestamp: Date.now(),
        provider: provider.id,
        redirect: window.location.pathname || '/'
      }));

      // Build OAuth2 authorization URL
      const authUrl = new URL(provider.authUrl);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', await getClientId(provider.id));
      authUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
      authUrl.searchParams.set('scope', provider.scopes.join(' '));
      authUrl.searchParams.set('state', state);

      // Store provider info for callback
      sessionStorage.setItem('oauth2_provider', provider.id);
      sessionStorage.setItem('oauth2_state', state);

      // Redirect to OAuth2 provider
      window.location.href = authUrl.toString();

      // Call callback if provided
      if (onProviderSelect) {
        onProviderSelect(provider);
      }

    } catch (error) {
      console.error('OAuth2 login failed:', error);
      setError(language === 'en' 
        ? 'Authentication failed. Please try again.' 
        : 'احراز هویت ناموفق بود. لطفا دوباره تلاش کنید.'
      );
      setIsAuthenticating(false);
      setSelectedProvider('');
    }
  };

  const getClientId = async (providerId: string): Promise<string> => {
    const response = await fetch(`/api/oauth2/providers/${providerId}/config`);
    if (!response.ok) {
      throw new Error('Failed to get client configuration');
    }
    const config = await response.json();
    return config.client_id;
  };

  const getProviderIcon = (provider: OAuth2Provider) => {
    switch (provider.id) {
      case 'auth0':
        return '🔐';
      case 'keycloak':
        return '🛡️';
      case 'google':
        return '🔍';
      case 'microsoft':
        return '🪟';
      case 'github':
        return '🐙';
      default:
        return '🔑';
    }
  };

  const getProviderColor = (provider: OAuth2Provider) => {
    switch (provider.id) {
      case 'auth0':
        return 'from-orange-500 to-red-600';
      case 'keycloak':
        return 'from-blue-500 to-indigo-600';
      case 'google':
        return 'from-red-500 to-pink-600';
      case 'microsoft':
        return 'from-blue-600 to-cyan-600';
      case 'github':
        return 'from-gray-700 to-gray-900';
      default:
        return 'from-green-500 to-teal-600';
    }
  };

  if (loading) {
    return (
      <Card className={cn("shadow-lg border-0 bg-white/95 backdrop-blur-sm", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
            <p className="text-gray-600">
              {language === 'en' ? 'Loading authentication options...' : 'در حال بارگذاری گزینه‌های احراز هویت...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-lg border-0 bg-white/95 backdrop-blur-sm", className)}>
      <CardHeader className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          {language === 'en' ? 'Secure Authentication' : 'احراز هویت امن'}
        </CardTitle>
        <CardDescription className="text-base text-gray-600">
          {language === 'en' 
            ? 'Choose your preferred authentication method' 
            : 'روش احراز هویت مورد نظر خود را انتخاب کنید'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OAuth2 Providers */}
        {providers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Globe className="h-4 w-4" />
              <span>
                {language === 'en' ? 'Enterprise Authentication' : 'احراز هویت سازمانی'}
              </span>
            </div>
            
            <div className="grid gap-3">
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  variant="outline"
                  size="lg"
                  disabled={!provider.isEnabled || !provider.isConfigured || isAuthenticating}
                  onClick={() => handleProviderLogin(provider)}
                  className={cn(
                    "h-16 justify-start gap-4 border-2 transition-all duration-300",
                    "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
                    selectedProvider === provider.id && isAuthenticating && "opacity-75",
                    !provider.isEnabled || !provider.isConfigured && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md",
                    `bg-gradient-to-br ${getProviderColor(provider)}`
                  )}>
                    {selectedProvider === provider.id && isAuthenticating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="text-lg">{getProviderIcon(provider)}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{provider.displayName}</span>
                      {provider.isConfigured && provider.isEnabled && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {provider.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!provider.isConfigured && (
                      <Badge variant="secondary" className="text-xs">
                        {language === 'en' ? 'Not Configured' : 'پیکربندی نشده'}
                      </Badge>
                    )}
                    {!provider.isEnabled && (
                      <Badge variant="destructive" className="text-xs">
                        {language === 'en' ? 'Disabled' : 'غیرفعال'}
                      </Badge>
                    )}
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Traditional Login Option */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Key className="h-4 w-4" />
            <span>
              {language === 'en' ? 'Traditional Authentication' : 'احراز هویت سنتی'}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={onTraditionalLogin}
            disabled={isAuthenticating}
            className="w-full h-16 justify-start gap-4 border-2 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <div className="h-10 w-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center text-white shadow-md">
              <Lock className="h-5 w-5" />
            </div>
            
            <div className="flex-1 text-left">
              <div className="font-semibold">
                {language === 'en' ? 'Username & Password' : 'نام کاربری و رمز عبور'}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {language === 'en' 
                  ? 'Sign in with your local account credentials' 
                  : 'با اطلاعات حساب محلی خود وارد شوید'
                }
              </p>
            </div>
          </Button>
        </div>

        {/* Security Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                {language === 'en' ? 'Security Notice' : 'اطلاعیه امنیتی'}
              </p>
              <p className="text-blue-700">
                {language === 'en' 
                  ? 'All authentication methods use industry-standard security protocols including OAuth2, JWT tokens, and encrypted connections.'
                  : 'تمام روش‌های احراز هویت از پروتکل‌های امنیتی استاندارد صنعت شامل OAuth2، توکن‌های JWT و اتصالات رمزگذاری شده استفاده می‌کنند.'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};