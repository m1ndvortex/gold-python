import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">طلا</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('app.title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'en' ? 'Sign in to your account' : 'وارد حساب کاربری خود شوید'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="mt-4"
          >
            {language === 'en' ? 'فارسی' : 'English'}
          </Button>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('auth.login')}</CardTitle>
            <CardDescription className="text-center">
              {language === 'en' 
                ? 'Enter your credentials to access the system' 
                : 'اطلاعات ورود خود را وارد کنید'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
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

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoggingIn || !isValid}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{language === 'en' ? 'Signing in...' : 'در حال ورود...'}</span>
                  </div>
                ) : (
                  t('auth.login')
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 text-center mb-2">
                {language === 'en' ? 'Demo Credentials:' : 'اطلاعات نمونه:'}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Owner:' : 'مالک:'}</span>
                  <span>admin / admin123</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Manager:' : 'مدیر:'}</span>
                  <span>manager / manager123</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Cashier:' : 'صندوقدار:'}</span>
                  <span>cashier / cashier123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};