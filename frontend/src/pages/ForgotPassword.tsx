import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle, Mail, ArrowLeft, Key } from 'lucide-react';

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const { language, setLanguage, direction } = useLanguage();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setFocus,
    clearErrors,
  } = useForm<ForgotPasswordFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  // Focus on email field when component mounts
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

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

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, show success
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(
        language === 'en' 
          ? 'Failed to send reset email. Please try again.' 
          : 'ارسال ایمیل بازیابی ناموفق. لطفا دوباره تلاش کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Design Elements */}
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
                  {language === 'en' ? 'Email Sent!' : 'ایمیل ارسال شد!'}
                </h2>
                <p className="text-slate-600 text-lg">
                  {language === 'en' 
                    ? 'Check your email for password reset instructions.' 
                    : 'ایمیل خود را برای دستورالعمل بازیابی رمز عبور بررسی کنید.'
                  }
                </p>
                <p className="text-sm text-slate-500">
                  {language === 'en' 
                    ? "Didn't receive the email? Check your spam folder or try again." 
                    : 'ایمیل را دریافت نکردید؟ پوشه اسپم خود را بررسی کنید یا دوباره تلاش کنید.'
                  }
                </p>
              </div>

              <div className="space-y-3">
                <Link to="/login">
                  <Button
                    variant="gradient-green"
                    size="lg"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Back to Login' : 'بازگشت به ورود'}
                  </Button>
                </Link>
                
                <Button
                  variant="outline"
                  onClick={() => setSubmitSuccess(false)}
                  className="w-full"
                >
                  {language === 'en' ? 'Try Different Email' : 'ایمیل دیگری امتحان کنید'}
                </Button>
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
                <Key className="h-10 w-10 text-white" />
              </div>
              {/* Enhanced floating ring animations */}
              <div className="absolute inset-0 h-20 w-20 rounded-3xl bg-gradient-to-br from-green-400 to-teal-500 opacity-20 animate-ping"></div>
              <div className="absolute inset-2 h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 opacity-15 animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-700 to-blue-600 bg-clip-text text-transparent">
              {language === 'en' ? 'Reset Password' : 'بازیابی رمز عبور'}
            </h2>
            <p className="text-slate-600 text-lg font-medium">
              {language === 'en' ? 'Enter your email to receive reset instructions' : 'ایمیل خود را برای دریافت دستورالعمل بازیابی وارد کنید'}
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="bg-white/70 backdrop-blur-sm border-green-200 hover:bg-white/90 hover:border-green-300 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <span className="mr-2">{language === 'en' ? '🇮🇷' : '🇺🇸'}</span>
              {language === 'en' ? 'فارسی' : 'English'}
            </Button>
            
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/70 backdrop-blur-sm border-blue-200 hover:bg-white/90 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Back to Login' : 'بازگشت به ورود'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Password Reset Form */}
        <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md hover:shadow-3xl transition-all duration-500">
          <CardHeader className="space-y-6 pb-8">
            <div className="text-center space-y-3">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                {language === 'en' ? 'Forgot Password' : 'فراموشی رمز عبور'}
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 font-medium">
                {language === 'en' 
                  ? 'We\'ll send you a link to reset your password' 
                  : 'لینک بازیابی رمز عبور را برای شما ارسال خواهیم کرد'
                }
              </CardDescription>
            </div>
            {/* Enhanced Security Badge */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 text-green-700 rounded-full text-sm font-medium shadow-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full animate-pulse"></div>
                <span>{language === 'en' ? '🔒 Secure Reset Process' : '🔒 فرآیند بازیابی امن'}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className={cn(
                  "text-sm font-medium flex items-center gap-2",
                  errors.email && "text-red-600"
                )}>
                  <Mail className="h-4 w-4" />
                  {language === 'en' ? 'Email Address' : 'آدرس ایمیل'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={cn(
                    "transition-colors h-12 text-base",
                    errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500",
                    direction === 'rtl' && "text-right"
                  )}
                  placeholder={language === 'en' ? 'Enter your email address' : 'آدرس ایمیل خود را وارد کنید'}
                  {...register('email', {
                    required: language === 'en' ? 'Email is required' : 'ایمیل الزامی است',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: language === 'en' ? 'Invalid email address' : 'آدرس ایمیل نامعتبر است'
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email.message}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {language === 'en' 
                    ? 'Enter the email address associated with your account' 
                    : 'ایمیل مرتبط با حساب کاربری خود را وارد کنید'
                  }
                </p>
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
                    <span>{language === 'en' ? 'Sending Email...' : 'در حال ارسال ایمیل...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Mail className="h-5 w-5" />
                    <span>{language === 'en' ? 'Send Reset Email' : 'ارسال ایمیل بازیابی'}</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Additional Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <div className="text-center space-y-2">
                <h4 className="text-sm font-semibold text-blue-700">
                  {language === 'en' ? '💡 What happens next?' : '💡 بعد چه اتفاقی می‌افتد؟'}
                </h4>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>{language === 'en' ? '• Check your email inbox' : '• صندوق ایمیل خود را بررسی کنید'}</li>
                  <li>{language === 'en' ? '• Click the reset link' : '• روی لینک بازیابی کلیک کنید'}</li>
                  <li>{language === 'en' ? '• Create a new password' : '• رمز عبور جدید ایجاد کنید'}</li>
                  <li>{language === 'en' ? '• Sign in with new password' : '• با رمز عبور جدید وارد شوید'}</li>
                </ul>
              </div>
            </div>

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