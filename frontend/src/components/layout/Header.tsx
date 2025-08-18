import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Sidebar } from './Sidebar';
import {
  Menu,
  LogOut,
  User,
  Globe,
  Bell,
  Search,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onSidebarToggle,
  className,
}) => {
  const { t, language, setLanguage, direction } = useLanguage();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isRTL = direction === 'rtl';

  const handleLanguageChange = (lang: 'en' | 'fa') => {
    setLanguage(lang);
  };

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side={isRTL ? "right" : "left"} 
              className="p-0 w-64"
            >
              <Sidebar
                isCollapsed={false}
                onToggle={() => setMobileMenuOpen(false)}
                className="border-0"
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop sidebar toggle */}
        <div className="hidden md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="h-8 w-8 p-0"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-md relative">
            <Search className={cn(
              'absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground',
              isRTL ? 'right-3' : 'left-3'
            )} />
            <input
              type="text"
              placeholder={t('common.search') || 'Search...'}
              className={cn(
                'w-full h-9 px-10 py-2 text-sm bg-background border border-input rounded-md',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'
              )}
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Change language"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"}>
              <DropdownMenuLabel>{t('common.language') || 'Language'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleLanguageChange('en')}
                className={cn(language === 'en' && 'bg-accent')}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLanguageChange('fa')}
                className={cn(language === 'fa' && 'bg-accent')}
              >
                فارسی
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.username} />
                  <AvatarFallback>
                    {getUserInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                <span>{t('common.profile') || 'Profile'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2" />
                <span>{t('auth.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};