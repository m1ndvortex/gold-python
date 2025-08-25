import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, ArrowLeft, Shield } from 'lucide-react';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [tokenValid, setTokenValid] = React.useState<boolean | null>(null);
  const { language, setLanguage, direction } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setFocus,
    watch,
    clearErrors,
  } = useForm<ResetPasswordFormData>({
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        // Simulate token validation
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTokenValid(true);
        setFocus('password');
      } catch (error) {
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token, setFocus]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError(null);
        clearErrors();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitError, clearErrors]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, show success
      setSubmitSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setSubmitError(
        language === 'en' 
          ? 'Failed to reset password. Please try again.' 
          : 'بازیابی رمز عبور ناموفق. لطفا دوباره تلاش کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-teal-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-700">
                  {language === 'en' ? 'Validating Reset Link...' : 'در حال اعتبارسنجی لینک بازیابی...'}
                </h2>
                <p className="text-slate-500">
                  {language === 'en' ? 'Please wait while we verify your reset token.' : 'لطفا منتظر بمانید تا توکن بازیابی شما تایید شود.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-200/30 to-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-200/30 to-yellow-300/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="h-20 w-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  {language === 'en' ? 'Invalid Reset Link' : 'لینک بازیابی نامعتبر'}
                </h2>
                <p className="text-slate-600 text-lg">
                  {language === 'en' 
                    ? 'This password reset link is invalid or has expired.' 
                    : 'این لینک بازیابی رمز عبور نامعتبر است یا منقضی شده است.'
                  }
                </p>
                <p className="text-sm text-slate-500">
                  {language === 'en' 
                    ? 'Please request a new password reset link.' 
                    : 'لطفا لینک بازیابی رمز عبور جدیدی درخواست کنید.'
                  }
                </p>
              </div>

              <div className="space-y-3">
                <Link to="/forgot-password">
                  <Button
                    variant="gradient-orange"
                    size="lg"
                    className="w-full"
                  >
                    {language === 'en' ? 'Request New Reset Link' : 'درخواست لینک بازیابی جدید'}
                  </Button>
                </Link>
                
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Back to Login' : 'بازگشت به ورود'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200/30 to-teal-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {language === 'en' ? 'Password Reset!' : 'رمز عبور بازیابی شد!'}
                </h2>
                <p className="text-slate-600 text-lg">
                  {language === 'en' 
                    ? 'Your password has been successfully reset. Redirecting to login...' 
                    : 'رمز عبور شما با موفقیت بازیابی شد. در حال انتقال به صفحه ورود...'
                  }
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                <Shield className="h-10 w-10 text-white" />
              </div>
              {/* Enhanced floating ring animations */}
              <div className="absolute inset-0 h-20 w-20 rounded-3xl bg-gradient-to-br from-green-400 to-teal-500 opacity-20 animate-ping"></div>
              <div className="absolute inset-2 h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 opacity-15 animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-700 to-blue-600 bg-clip-text text-transparent">
              {language === 'en' ? 'Set New Password' : 'تنظیم رمز عبور جدید'}
            </h2>
            <p className="text-slate-600 text-lg font-medium">
              {language === 'en' ? 'Create a strong password for your account' : 'رمز عبور قوی برای حساب خود ایجاد کنید'}
            </p>
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

        {/* Enhanced Reset Password Form */}
        <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md hover:shadow-3xl transition-all duration-500">
          <CardHeader className="space-y-6 pb-8">
            <div className="text-center space-y-3">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                {language === 'en' ? 'New Password' : 'رمز عبور جدید'}
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 font-medium">
                {language === 'en' 
                  ? 'Choose a strong password to secure your account' 
                  : 'رمز عبور قوی برای امنیت حساب خود انتخاب کنید'
                }
              </CardDescription>
            </div>
            {/* Enhanced Security Badge */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 text-green-700 rounded-full text-sm font-medium shadow-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full animate-pulse"></div>
                <span>{language === 'en' ? '🔒 Secure Password Reset' : '🔒 بازیابی امن رمز عبور'}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className={cn(
                  "text-sm font-medium flex items-center gap-2",
                  errors.password && "text-red-600"
                )}>
                  <Lock className="h-4 w-4" />
                  {language === 'en' ? 'New Password' : 'رمز عبور جدید'}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn(
                      "transition-colors pr-10 h-12 text-base",
                      errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      direction === 'rtl' && "text-right pl-10 pr-3"
                    )}
                    placeholder={language === 'en' ? 'Enter new password' : 'رمز عبور جدید را وارد کنید'}
                    {...register('password', {
                      required: language === 'en' ? 'Password is required' : 'رمز عبور الزامی است',
                      minLength: {
                        value: 8,
                        message: language === 'en' ? 'Password must be at least 8 characters' : 'رمز عبور باید حداقل ۸ کاراکتر باشد'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: language === 'en' ? 'Password must contain uppercase, lowercase, and number' : 'رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد'
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={cn(
                  "text-sm font-medium flex items-center gap-2",
                  errors.confirmPassword && "text-red-600"
                )}>
                  <Lock className="h-4 w-4" />
                  {language === 'en' ? 'Confirm New Password' : 'تایید رمز عبور جدید'}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={cn(
                      "transition-colors pr-10 h-12 text-base",
                      errors.confirmPassword && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      direction === 'rtl' && "text-right pl-10 pr-3"
                    )}
                    placeholder={language === 'en' ? 'Confirm new password' : 'رمز عبور جدید را تایید کنید'}
                    {...register('confirmPassword', {
                      required: language === 'en' ? 'Please confirm your password' : 'لطفا رمز عبور را تایید کنید',
                      validate: (value) => 
                        value === password || (language === 'en' ? 'Passwords do not match' : 'رمزهای عبور مطابقت ندارند')
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
                    onClick={toggleConfirmPasswordVisibility}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-700 mb-2">
                  {language === 'en' ? '🔐 Password Requirements:' : '🔐 الزامات رمز عبور:'}
                </h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li className={cn(
                    "flex items-center gap-2",
                    password && password.length >= 8 ? "text-green-600" : "text-blue-600"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      password && password.length >= 8 ? "bg-green-500" : "bg-blue-400"
                    )}></div>
                    {language === 'en' ? 'At least 8 characters' : 'حداقل ۸ کاراکتر'}
                  </li>
                  <li className={cn(
                    "flex items-center gap-2",
                    password && /[A-Z]/.test(password) ? "text-green-600" : "text-blue-600"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      password && /[A-Z]/.test(password) ? "bg-green-500" : "bg-blue-400"
                    )}></div>
                    {language === 'en' ? 'One uppercase letter' : 'یک حرف بزرگ'}
                  </li>
                  <li className={cn(
                    "flex items-center gap-2",
                    password && /[a-z]/.test(password) ? "text-green-600" : "text-blue-600"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      password && /[a-z]/.test(password) ? "bg-green-500" : "bg-blue-400"
                    )}></div>
                    {language === 'en' ? 'One lowercase letter' : 'یک حرف کوچک'}
                  </li>
                  <li className={cn(
                    "flex items-center gap-2",
                    password && /\d/.test(password) ? "text-green-600" : "text-blue-600"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      password && /\d/.test(password) ? "bg-green-500" : "bg-blue-400"
                    )}></div>
                    {language === 'en' ? 'One number' : 'یک عدد'}
                  </li>
                </ul>
              </div>

              {/* Error Alert */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {submitError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                variant="gradient-green"
                size="lg"
                className="w-full h-14 text-white font-semibold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:shadow-green-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    <span>{language === 'en' ? 'Resetting Password...' : 'در حال بازیابی رمز عبور...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Shield className="h-5 w-5" />
                    <span>{language === 'en' ? 'Reset Password' : 'بازیابی رمز عبور'}</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Remember your password?' : 'رمز عبور خود را به یاد آوردید؟'}{' '}
                <Link 
                  to="/login" 
                  className="font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                  {language === 'en' ? 'Sign in here' : 'اینجا وارد شوید'}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};