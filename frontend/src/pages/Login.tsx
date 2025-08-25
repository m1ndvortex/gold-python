import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LoginCredentials } from '../types';
import { cn } from '../lib/utils';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginFormData extends LoginCredentials {
  rememberMe?: boolean;
}

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const { login, isLoggingIn, loginError, isAuthenticated, isLoading } = useAuth();
  const { t, language, setLanguage, direction } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setFocus,
    clearErrors,
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
  });

  // Focus on username field when component mounts
  useEffect(() => {
    setFocus('username');
  }, [setFocus]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (loginError) {
      const timer = setTimeout(() => {
        clearErrors();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loginError, clearErrors]);

  // Handle navigation when authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-amber-600 border-t-transparent rounded-full" />
          <p className="text-gray-600">
            {language === 'en' ? 'Loading...' : 'در حال بارگذاری...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render login form while redirecting
  if (isAuthenticated) {
    return null;
  }

  const onSubmit = (data: LoginFormData) => {
    login({
      username: data.username.trim(),
      password: data.password,
    });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getErrorMessage = (error: any): string => {
    if (!error) return '';
    
    if (error.response?.status === 401) {
      return language === 'en' 
        ? 'Invalid username or password' 
        : 'نام کاربری یا رمز عبور اشتباه است';
    }
    
    if (error.response?.status === 400) {
      return language === 'en' 
        ? 'Account is inactive' 
        : 'حساب کاربری غیرفعال است';
    }
    
    if (error.code === 'NETWORK_ERROR' || !error.response) {
      return language === 'en' 
        ? 'Network error. Please check your connection.' 
        : 'خطای شبکه. لطفا اتصال خود را بررسی کنید.';
    }
    
    return language === 'en' 
      ? 'Login failed. Please try again.' 
      : 'ورود ناموفق. لطفا دوباره تلاش کنید.';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced Background Design Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-teal-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-100/20 to-blue-100/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-300/15 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-cyan-200/20 to-blue-300/15 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-br from-green-500 via-teal-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/25 mb-6 transform hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-3xl">طلا</span>
              </div>
              {/* Enhanced floating ring animations */}
              <div className="absolute inset-0 h-20 w-20 rounded-3xl bg-gradient-to-br from-green-400 to-teal-500 opacity-20 animate-ping"></div>
              <div className="absolute inset-2 h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 opacity-15 animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-green-600 via-teal-700 to-blue-600 bg-clip-text text-transparent">
              {t('app.title')}
            </h2>
            <p className="text-slate-600 text-xl font-medium">
              {language === 'en' ? 'Welcome back to your gold shop management system' : 'به سیستم مدیریت طلافروشی خود خوش آمدید'}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{language === 'en' ? 'Secure • Professional • Reliable' : 'امن • حرفه‌ای • قابل اعتماد'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="bg-white/70 backdrop-blur-sm border-green-200 hover:bg-white/90 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">{language === 'en' ? '🇮🇷' : '🇺🇸'}</span>
              {language === 'en' ? 'فارسی' : 'English'}
            </Button>
          </div>
        </div>

        {/* Enhanced Login Form */}
        <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md hover:shadow-3xl transition-all duration-500">
          <CardHeader className="space-y-6 pb-8">
            <div className="text-center space-y-3">
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                {t('auth.login')}
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 font-medium">
                {language === 'en' 
                  ? 'Enter your credentials to access the management system' 
                  : 'اطلاعات ورود خود را برای دسترسی به سیستم وارد کنید'
                }
              </CardDescription>
            </div>
            {/* Enhanced Security Badge */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 text-green-700 rounded-full text-sm font-medium shadow-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full animate-pulse"></div>
                <span>{language === 'en' ? '🔒 Secure Connection' : '🔒 اتصال امن'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className={cn(
                  "text-sm font-medium",
                  errors.username && "text-red-600"
                )}>
                  {language === 'en' ? 'Username' : 'نام کاربری'}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className={cn(
                    "transition-colors",
                    errors.username && "border-red-500 focus:border-red-500 focus:ring-red-500",
                    direction === 'rtl' && "text-right"
                  )}
                  placeholder={language === 'en' ? 'Enter username' : 'نام کاربری را وارد کنید'}
                  {...register('username', {
                    required: language === 'en' ? 'Username is required' : 'نام کاربری الزامی است',
                    minLength: {
                      value: 3,
                      message: language === 'en' ? 'Username must be at least 3 characters' : 'نام کاربری باید حداقل ۳ کاراکتر باشد'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: language === 'en' ? 'Username can only contain letters, numbers, and underscores' : 'نام کاربری فقط می‌تواند شامل حروف، اعداد و خط زیر باشد'
                    }
                  })}
                />
                {errors.username && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className={cn(
                  "text-sm font-medium",
                  errors.password && "text-red-600"
                )}>
                  {language === 'en' ? 'Password' : 'رمز عبور'}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn(
                      "transition-colors pr-10",
                      errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      direction === 'rtl' && "text-right pl-10 pr-3"
                    )}
                    placeholder={language === 'en' ? 'Enter password' : 'رمز عبور را وارد کنید'}
                    {...register('password', {
                      required: language === 'en' ? 'Password is required' : 'رمز عبور الزامی است',
                      minLength: {
                        value: 6,
                        message: language === 'en' ? 'Password must be at least 6 characters' : 'رمز عبور باید حداقل ۶ کاراکتر باشد'
                      }
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "absolute top-0 h-full px-3 py-2 hover:bg-transparent",
                      direction === 'rtl' ? "left-0" : "right-0"
                    )}
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  {...register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
                  {language === 'en' ? 'Remember me' : 'مرا به خاطر بسپار'}
                </Label>
              </div>

              {/* Error Alert */}
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {getErrorMessage(loginError)}
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Submit Button */}
              <Button
                type="submit"
                disabled={isLoggingIn || !isValid}
                variant="gradient-green"
                size="lg"
                className="w-full h-14 text-white font-semibold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:shadow-green-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    <span>{language === 'en' ? 'Signing in...' : 'در حال ورود...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>{t('auth.login')}</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </Button>
            </form>

            {/* Enhanced Demo Credentials */}
            <div className="mt-8 p-6 bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 rounded-2xl border border-green-200 shadow-lg">
              <div className="text-center mb-6">
                <h4 className="text-lg font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  {language === 'en' ? '🎯 Demo Access' : '🎯 دسترسی نمونه'}
                </h4>
                <p className="text-sm text-slate-600 font-medium">
                  {language === 'en' ? 'Use these credentials to explore the system' : 'از این اطلاعات برای کاوش سیستم استفاده کنید'}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md border border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">👑</span>
                    </div>
                    <span className="text-base font-semibold text-blue-700">
                      {language === 'en' ? 'Owner' : 'مالک'}
                    </span>
                  </div>
                  <span className="text-sm font-mono bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 rounded-lg text-blue-800 border border-blue-200">admin / admin123</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">⚡</span>
                    </div>
                    <span className="text-base font-semibold text-green-700">
                      {language === 'en' ? 'Manager' : 'مدیر'}
                    </span>
                  </div>
                  <span className="text-sm font-mono bg-gradient-to-r from-green-50 to-teal-50 px-3 py-2 rounded-lg text-green-800 border border-green-200">manager / manager123</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md border border-amber-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">💰</span>
                    </div>
                    <span className="text-base font-semibold text-amber-700">
                      {language === 'en' ? 'Cashier' : 'صندوقدار'}
                    </span>
                  </div>
                  <span className="text-sm font-mono bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 rounded-lg text-amber-800 border border-amber-200">cashier / cashier123</span>
                </div>
              </div>
            </div>

            {/* Additional Authentication Links */}
            <div className="text-center pt-6 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-center gap-6">
                <Link 
                  to="/register" 
                  className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors flex items-center gap-1"
                >
                  <span>{language === 'en' ? 'Create Account' : 'ایجاد حساب کاربری'}</span>
                </Link>
                <div className="w-px h-4 bg-gray-300"></div>
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                >
                  <span>{language === 'en' ? 'Forgot Password?' : 'فراموشی رمز عبور؟'}</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};