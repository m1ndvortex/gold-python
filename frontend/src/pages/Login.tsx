import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn, loginError, isAuthenticated } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
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

        <Card>
          <CardHeader>
            <CardTitle>{t('auth.login')}</CardTitle>
            <CardDescription>
              {language === 'en' 
                ? 'Enter your credentials to access the system' 
                : 'اطلاعات ورود خود را وارد کنید'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Username' : 'نام کاربری'}
                  </label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1"
                    placeholder={language === 'en' ? 'Enter username' : 'نام کاربری را وارد کنید'}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Password' : 'رمز عبور'}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                    placeholder={language === 'en' ? 'Enter password' : 'رمز عبور را وارد کنید'}
                  />
                </div>

                {loginError && (
                  <div className="text-red-600 text-sm">
                    {language === 'en' 
                      ? 'Login failed. Please check your credentials.' 
                      : 'ورود ناموفق. لطفا اطلاعات خود را بررسی کنید.'
                    }
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full"
                >
                  {isLoggingIn 
                    ? (language === 'en' ? 'Signing in...' : 'در حال ورود...') 
                    : t('auth.login')
                  }
                </Button>
              </>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};