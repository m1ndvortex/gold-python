import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Eye,
  Edit,
  Users,
  Settings,
  Database,
  Key,
  Globe,
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';

interface OAuth2ConsentRequest {
  client_id: string;
  client_name: string;
  client_description: string;
  client_logo_url?: string;
  redirect_uri: string;
  scopes: OAuth2Scope[];
  state: string;
  response_type: string;
  user_info: {
    username: string;
    email: string;
    role: string;
  };
}

interface OAuth2Scope {
  name: string;
  display_name: string;
  description: string;
  category: 'basic' | 'profile' | 'permissions' | 'data';
  required: boolean;
  sensitive: boolean;
  icon: string;
}

export const OAuth2ConsentInterface: React.FC = () => {
  const { language, direction } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State
  const [consentRequest, setConsentRequest] = useState<OAuth2ConsentRequest | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadConsentRequest();
  }, []);

  const loadConsentRequest = async () => {
    try {
      setLoading(true);
      
      // Get consent request parameters from URL
      const clientId = searchParams.get('client_id');
      const state = searchParams.get('state');
      const responseType = searchParams.get('response_type');
      const redirectUri = searchParams.get('redirect_uri');
      const scope = searchParams.get('scope');

      if (!clientId || !state || !responseType || !redirectUri) {
        throw new Error('Missing required OAuth2 parameters');
      }

      // Fetch consent request details from backend
      const response = await fetch('/api/oauth2/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          client_id: clientId,
          state: state,
          response_type: responseType,
          redirect_uri: redirectUri,
          scope: scope
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load consent request');
      }

      const data = await response.json();
      setConsentRequest(data);
      
      // Pre-select required scopes
      const requiredScopes = data.scopes
        .filter((scope: OAuth2Scope) => scope.required)
        .map((scope: OAuth2Scope) => scope.name);
      setSelectedScopes(requiredScopes);

    } catch (error) {
      console.error('Failed to load consent request:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleScopeToggle = (scopeName: string, required: boolean) => {
    if (required) return; // Cannot toggle required scopes

    setSelectedScopes(prev => 
      prev.includes(scopeName)
        ? prev.filter(s => s !== scopeName)
        : [...prev, scopeName]
    );
  };

  const handleApprove = async () => {
    if (!consentRequest) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/oauth2/consent/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          client_id: consentRequest.client_id,
          state: consentRequest.state,
          scopes: selectedScopes,
          redirect_uri: consentRequest.redirect_uri
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve consent');
      }

      const data = await response.json();
      
      // Redirect to the authorization server with approval
      const redirectUrl = new URL(consentRequest.redirect_uri);
      redirectUrl.searchParams.set('code', data.authorization_code);
      redirectUrl.searchParams.set('state', consentRequest.state);
      
      window.location.href = redirectUrl.toString();

    } catch (error) {
      console.error('Failed to approve consent:', error);
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!consentRequest) return;

    setSubmitting(true);

    try {
      // Redirect back with error
      const redirectUrl = new URL(consentRequest.redirect_uri);
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set('error_description', 'User denied the request');
      redirectUrl.searchParams.set('state', consentRequest.state);
      
      window.location.href = redirectUrl.toString();

    } catch (error) {
      console.error('Failed to deny consent:', error);
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (!error) return '';

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('invalid_client')) {
      return language === 'en' 
        ? 'Invalid client application. Please contact support.' 
        : 'برنامه کلاینت نامعتبر. لطفا با پشتیبانی تماس بگیرید.';
    }

    if (errorMessage.includes('invalid_request')) {
      return language === 'en' 
        ? 'Invalid authorization request. Please try again.' 
        : 'درخواست مجوز نامعتبر. لطفا دوباره تلاش کنید.';
    }

    return language === 'en' 
      ? `Authorization failed: ${errorMessage}` 
      : `مجوزدهی ناموفق بود: ${errorMessage}`;
  };

  const getScopeIcon = (scope: OAuth2Scope) => {
    switch (scope.category) {
      case 'basic':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'profile':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'permissions':
        return <Key className="h-4 w-4 text-purple-600" />;
      case 'data':
        return <Database className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getScopeColor = (scope: OAuth2Scope) => {
    if (scope.sensitive) {
      return 'border-red-200 bg-red-50';
    }
    if (scope.required) {
      return 'border-blue-200 bg-blue-50';
    }
    return 'border-gray-200 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
        <Card className="max-w-md w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="py-12 px-8">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <p className="text-gray-600">
                {language === 'en' ? 'Loading authorization request...' : 'در حال بارگذاری درخواست مجوز...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 py-12 px-4">
        <Card className="max-w-md w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="py-12 px-8">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'en' ? 'Authorization Error' : 'خطای مجوزدهی'}
              </h2>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                {language === 'en' ? 'Return to Login' : 'بازگشت به ورود'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!consentRequest) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          {/* Client Logo/Icon */}
          <div className="flex items-center justify-center">
            {consentRequest.client_logo_url ? (
              <img
                src={consentRequest.client_logo_url}
                alt={consentRequest.client_name}
                className="h-16 w-16 rounded-2xl shadow-lg"
              />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {language === 'en' ? 'Authorization Request' : 'درخواست مجوز'}
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              <strong>{consentRequest.client_name}</strong> {' '}
              {language === 'en' 
                ? 'is requesting access to your account' 
                : 'درخواست دسترسی به حساب شما را دارد'
              }
            </CardDescription>
          </div>

          {/* User Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {consentRequest.user_info.username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-medium text-blue-900">
                  {consentRequest.user_info.username}
                </p>
                <p className="text-sm text-blue-700">
                  {consentRequest.user_info.email}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Client Description */}
          {consentRequest.client_description && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'About this application' : 'درباره این برنامه'}
              </h3>
              <p className="text-sm text-gray-600">{consentRequest.client_description}</p>
            </div>
          )}

          {/* Permissions/Scopes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {language === 'en' ? 'Requested Permissions' : 'مجوزهای درخواستی'}
              </h3>
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showDetails 
                  ? (language === 'en' ? 'Hide Details' : 'مخفی کردن جزئیات')
                  : (language === 'en' ? 'Show Details' : 'نمایش جزئیات')
                }
              </Button>
            </div>

            <div className="space-y-3">
              {consentRequest.scopes.map((scope) => (
                <div
                  key={scope.name}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-200",
                    getScopeColor(scope),
                    selectedScopes.includes(scope.name) && "ring-2 ring-blue-500 ring-opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mt-1">
                      <Checkbox
                        checked={selectedScopes.includes(scope.name)}
                        onCheckedChange={() => handleScopeToggle(scope.name, scope.required)}
                        disabled={scope.required}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      {getScopeIcon(scope)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{scope.display_name}</h4>
                        {scope.required && (
                          <Badge variant="secondary" className="text-xs">
                            {language === 'en' ? 'Required' : 'الزامی'}
                          </Badge>
                        )}
                        {scope.sensitive && (
                          <Badge variant="destructive" className="text-xs">
                            {language === 'en' ? 'Sensitive' : 'حساس'}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{scope.description}</p>
                      
                      {showDetails && (
                        <div className="text-xs text-gray-500 bg-white/50 p-2 rounded border">
                          <strong>{language === 'en' ? 'Scope:' : 'دامنه:'}</strong> {scope.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 mb-1">
                  {language === 'en' ? 'Security Notice' : 'اطلاعیه امنیتی'}
                </p>
                <p className="text-yellow-700">
                  {language === 'en' 
                    ? 'Only approve this request if you trust this application. You can revoke access at any time from your account settings.'
                    : 'فقط در صورتی که به این برنامه اعتماد دارید، این درخواست را تأیید کنید. می‌توانید در هر زمان دسترسی را از تنظیمات حساب خود لغو کنید.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleApprove}
              disabled={submitting || selectedScopes.length === 0}
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>
                    {language === 'en' ? 'Approving...' : 'در حال تأیید...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>
                    {language === 'en' ? 'Approve' : 'تأیید'}
                  </span>
                </div>
              )}
            </Button>

            <Button
              onClick={handleDeny}
              disabled={submitting}
              variant="outline"
              className="flex-1 h-12 border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <span>
                  {language === 'en' ? 'Deny' : 'رد'}
                </span>
              </div>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>
              {language === 'en' 
                ? 'This request is secured with OAuth2 protocol' 
                : 'این درخواست با پروتکل OAuth2 امن شده است'
              }
            </p>
            <div className="flex items-center justify-center gap-1">
              <Globe className="h-3 w-3" />
              <span>{consentRequest.redirect_uri}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};