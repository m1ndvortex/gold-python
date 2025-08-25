import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock, ArrowLeft } from 'lucide-react';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export const Register: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [registrationError, setRegistrationError] = React.useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = React.useState(false);
  const { language, setLanguage, direction } = useLanguage();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setFocus,
    watch,
    clearErrors,
  } = useForm<RegisterFormData>({
    mode: 'onChange',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptTerms: false,
    },
  });

  const password = watch('password');

  // Focus on first name field when component mounts
  useEffect(() => {
    setFocus('firstName');
  }, [setFocus]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (registrationError) {
      const timer = setTimeout(() => {
        setRegistrationError(null);
        clearErrors();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [registrationError, clearErrors]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, show success
      setRegistrationSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setRegistrationError(
        language === 'en' 
          ? 'Registration failed. Please try again.' 
          : 'ثبت نام ناموفق. لطفا دوباره تلاش کنید.'
      );
    } finally {
      setIsRegistering(false);
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

  if (registrationSuccess) {
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
                  {language === 'en' ? 'Registration Successful!' : 'ثبت نام موفقیت آمیز!'}
                </h2>
                <p className="text-slate-600 text-lg">
                  {language === 'en' 
                    ? 'Your account has been created successfully. Redirecting to login...' 
                    : 'حساب کاربری شما با موفقیت ایجاد شد. در حال انتقال به صفحه ورود...'
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

      <div className="max-w-lg w-full space-y-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="h-20 w-20 bg-gradient-to-br from-green-500 via-teal-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/25 mb-6 transform hover:scale-105 transition-all duration-300">
                <User className="h-10 w-10 text-white" />
              </div>
              {/* Enhanced floating ring animations */}
              <div className="absolute inset-0 h-20 w-20 rounded-3xl bg-gradient-to-br from-green-400 to-teal-500 opacity-20 animate-ping"></div>
              <div className="absolute inset-2 h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 opacity-15 animate-pulse"></div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-700 to-blue-600 bg-clip-text text-transparent">
              {language === 'en' ? 'Create Account' : 'ایجاد حساب کاربری'}
            </h2>
            <p className="text-slate-600 text-lg font-medium">
              {language === 'en' ? 'Join the gold shop management system' : 'به سیستم مدیریت طلافروشی بپیوندید'}
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

        {/* Enhanced Registration Form */}
        <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-md hover:shadow-3xl transition-all duration-500">
          <CardHeader className="space-y-6 pb-8">
            <div className="text-center space-y-3">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                {language === 'en' ? 'Register' : 'ثبت نام'}
              </CardTitle>
              <CardDescription className="text-lg text-slate-600 font-medium">
                {language === 'en' 
                  ? 'Fill in your information to create your account' 
                  : 'اطلاعات خود را برای ایجاد حساب کاربری وارد کنید'
                }
              </CardDescription>
            </div>
            {/* Enhanced Security Badge */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 text-green-700 rounded-full text-sm font-medium shadow-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full animate-pulse"></div>
                <span>{language === 'en' ? '🔒 Secure Registration' : '🔒 ثبت نام امن'}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className={cn(
                    "text-sm font-medium flex items-center gap-2",
                    errors.firstName && "text-red-600"
                  )}>
                    <User className="h-4 w-4" />
                    {language === 'en' ? 'First Name' : 'نام'}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    className={cn(
                      "transition-colors",
                      errors.firstName && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      direction === 'rtl' && "text-right"
                    )}
                    placeholder={language === 'en' ? 'Enter first name' : 'نام را وارد کنید'}
                    {...register('firstName', {
                      required: language === 'en' ? 'First name is required' : 'نام الزامی است',
                      minLength: {
                        value: 2,
                        message: language === 'en' ? 'First name must be at least 2 characters' : 'نام باید حداقل ۲ کاراکتر باشد'
                      }
                    })}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                {/* Last Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className={cn(
                    "text-sm font-medium flex items-center gap-2",
                    errors.lastName && "text-red-600"
                  )}>
                    <User className="h-4 w-4" />
                    {language === 'en' ? 'Last Name' : 'نام خانوادگی'}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    className={cn(
                      "transition-colors",
                      errors.lastName && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      direction === 'rtl' && "text-right"
                    )}
                    placeholder={language === 'en' ? 'Enter last name' : 'نام خانوادگی را وارد کنید'}
                    {...register('lastName', {
                      required: language === 'en' ? 'Last name is required' : 'نام خانوادگی الزامی است',
                      minLength: {
                        value: 2,
                        message: language === 'en' ? 'Last name must be at least 2 characters' : 'نام خانوادگی باید حداقل ۲ کاراکتر باشد'
                      }
                    })}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className={cn(
                  "text-sm font-medium flex items-center gap-2",
                  errors.email && "text-red-600"
                )}>
                  <Mail className="h-4 w-4" />
                  {language === 'en' ? 'Email' : 'ایمیل'}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={cn(
                    "transition-colors",
                    errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500",
                    direction === 'rtl' && "text-right"
                  )}
                  placeholder={language === 'en' ? 'Enter email address' : 'آدرس ایمیل را وارد کنید'}
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
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className={cn(
                  "text-sm font-medium flex items-center gap-2",
                  errors.username && "text-red-600"
                )}>
                  <User className="h-4 w-4" />
                  {language === 'en' ? 'Username' : 'نام کاربری'}
                  <span className="text-red-500">*</span>
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
                  placeholder={language === 'en' ? 'Choose a username' : 'نام کاربری انتخاب کنید'}
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

              {/* Password Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className={cn(
                    "text-sm font-medium flex items-center gap-2",
                    errors.password && "text-red-600"
                  )}>
                    <Lock className="h-4 w-4" />
                    {language === 'en' ? 'Password' : 'رمز عبور'}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={cn(
                        "transition-colors pr-10",
                        errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        direction === 'rtl' && "text-right pl-10 pr-3"
                      )}
                      placeholder={language === 'en' ? 'Create password' : 'رمز عبور ایجاد کنید'}
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
                    {language === 'en' ? 'Confirm Password' : 'تایید رمز عبور'}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className={cn(
                        "transition-colors pr-10",
                        errors.confirmPassword && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        direction === 'rtl' && "text-right pl-10 pr-3"
                      )}
                      placeholder={language === 'en' ? 'Confirm password' : 'رمز عبور را تایید کنید'}
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
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                  {...register('acceptTerms', {
                    required: language === 'en' ? 'You must accept the terms and conditions' : 'باید شرایط و قوانین را بپذیرید'
                  })}
                />
                <Label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer leading-5">
                  {language === 'en' ? (
                    <>
                      I agree to the{' '}
                      <Link to="/terms" className="text-green-600 hover:text-green-700 underline">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-green-600 hover:text-green-700 underline">
                        Privacy Policy
                      </Link>
                    </>
                  ) : (
                    <>
                      با{' '}
                      <Link to="/terms" className="text-green-600 hover:text-green-700 underline">
                        شرایط و قوانین
                      </Link>{' '}
                      و{' '}
                      <Link to="/privacy" className="text-green-600 hover:text-green-700 underline">
                        حریم خصوصی
                      </Link>{' '}
                      موافقم
                    </>
                  )}
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.acceptTerms.message}
                </p>
              )}

              {/* Error Alert */}
              {registrationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {registrationError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Enhanced Submit Button */}
              <Button
                type="submit"
                disabled={isRegistering || !isValid}
                variant="gradient-green"
                size="lg"
                className="w-full h-14 text-white font-semibold text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:shadow-green-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isRegistering ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    <span>{language === 'en' ? 'Creating Account...' : 'در حال ایجاد حساب...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>{language === 'en' ? 'Create Account' : 'ایجاد حساب کاربری'}</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Already have an account?' : 'قبلا حساب کاربری دارید؟'}{' '}
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