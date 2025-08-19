import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
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
import { MobileSidebar } from './MobileSidebar';
import {
  Menu,
  LogOut,
  User,
  Globe,
  Bell,
  Search,
  Settings,
  HelpCircle,
  Gem,
  TrendingUp,
  Package,
  Users,
  FileText,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  className?: string;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'product' | 'customer' | 'invoice' | 'page';
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onSidebarToggle,
  className,
}) => {
  const { t, language, setLanguage, direction } = useLanguage();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isRTL = direction === 'rtl';

  // Mock search results - in real app, this would come from an API
  const mockSearchResults: SearchResult[] = [
    {
      id: '1',
      title: 'Gold Ring 18K',
      type: 'product',
      description: 'Premium gold ring with diamond',
      icon: Gem,
      href: '/inventory/products/1',
    },
    {
      id: '2',
      title: 'John Smith',
      type: 'customer',
      description: 'Regular customer since 2020',
      icon: Users,
      href: '/customers/2',
    },
    {
      id: '3',
      title: 'Invoice #INV-001',
      type: 'invoice',
      description: 'Pending payment - $2,500',
      icon: FileText,
      href: '/invoices/3',
    },
    {
      id: '4',
      title: 'Dashboard',
      type: 'page',
      description: 'Main dashboard overview',
      icon: TrendingUp,
      href: '/dashboard',
    },
  ];

  // Mock notifications - in real app, this would come from an API
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Low Stock Alert',
      message: 'Gold chains inventory is running low (5 items remaining)',
      type: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      actionUrl: '/inventory/products',
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'Payment of $1,200 received from John Smith',
      type: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      actionUrl: '/invoices',
    },
    {
      id: '3',
      title: 'System Update',
      message: 'System maintenance scheduled for tonight at 2 AM',
      type: 'info',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      read: true,
    },
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = mockSearchResults.filter(
        result =>
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Handle click outside for search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertCircle;
      case 'error':
        return AlertCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const hasUnreadNotifications = unreadNotifications.length > 0;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border/50 bg-gradient-to-r from-background via-background to-background/95',
        'backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-primary/5',
        className
      )}
    >
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        <MobileSidebar className="mr-2" />

        {/* Desktop sidebar toggle */}
        <div className="hidden md:block mr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className={cn(
              'h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
              'border border-transparent hover:border-primary/20 rounded-lg'
            )}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <motion.div
              animate={{ rotate: isSidebarCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <Menu className="h-4 w-4" />
            </motion.div>
          </Button>
        </div>

        {/* Company Branding */}
        <div className="hidden lg:flex items-center mr-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary/25">
                <Gem className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight">
                Gold Shop
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Professional
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Global Search */}
        <div className="flex-1 flex justify-center px-4 max-w-2xl mx-auto" ref={searchRef}>
          <div className="w-full relative">
            <div className="relative">
              <Search className={cn(
                'absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors',
                searchQuery && 'text-primary-500',
                isRTL ? 'right-3' : 'left-3'
              )} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search') || 'Search products, customers, invoices...'}
                className={cn(
                  'w-full h-10 px-10 py-2 text-sm bg-background/50 border border-border rounded-xl',
                  'placeholder:text-muted-foreground backdrop-blur-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30',
                  'hover:bg-background/80 transition-all duration-200',
                  'shadow-sm hover:shadow-md',
                  isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'
                )}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className={cn(
                    'absolute top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full',
                    'hover:bg-muted flex items-center justify-center transition-colors',
                    isRTL ? 'left-2' : 'right-2'
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-2">
                    <div className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wide">
                      Search Results
                    </div>
                    {searchResults.map((result) => {
                      const Icon = result.icon;
                      return (
                        <motion.a
                          key={result.id}
                          href={result.href}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center p-3 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer group"
                          onClick={() => setShowSearchResults(false)}
                        >
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-4 w-4 text-primary-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {result.title}
                            </div>
                            {result.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {result.description}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            <Badge variant="secondary" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                        </motion.a>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Notification Center */}
          <div className="relative" ref={notificationRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
                'border border-transparent hover:border-primary/20 rounded-lg relative',
                showNotifications && 'bg-primary/10 text-primary-600 border-primary/20'
              )}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {hasUnreadNotifications && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-xs text-white font-bold">
                    {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
                  </span>
                </motion.div>
              )}
            </Button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'absolute top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl',
                    isRTL ? 'left-0' : 'right-0'
                  )}
                >
                  <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                      {hasUnreadNotifications && (
                        <Badge variant="secondary" className="text-xs">
                          {unreadNotifications.length} new
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        return (
                          <motion.div
                            key={notification.id}
                            whileHover={{ backgroundColor: 'rgba(var(--primary), 0.02)' }}
                            className={cn(
                              'p-4 border-b border-border/50 cursor-pointer transition-colors',
                              !notification.read && 'bg-primary/5'
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={cn('flex-shrink-0 mt-0.5', getNotificationColor(notification.type))}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 ml-2" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatTimeAgo(notification.timestamp)}
                                  </span>
                                  {notification.actionUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-primary-600 hover:text-primary-700"
                                    >
                                      View
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No notifications</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-border bg-muted/20">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-primary-600 hover:text-primary-700"
                      >
                        View all notifications
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary-600 transition-all duration-200',
                  'border border-transparent hover:border-primary/20 rounded-lg'
                )}
                aria-label="Change language"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('common.language') || 'Language'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  'cursor-pointer transition-colors',
                  language === 'en' && 'bg-primary/10 text-primary-700'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span>English</span>
                  {language === 'en' && <CheckCircle className="h-4 w-4 text-primary-600" />}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleLanguageChange('fa')}
                className={cn(
                  'cursor-pointer transition-colors',
                  language === 'fa' && 'bg-primary/10 text-primary-700'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span>فارسی</span>
                  {language === 'fa' && <CheckCircle className="h-4 w-4 text-primary-600" />}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Enhanced User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'relative h-9 w-9 rounded-full hover:bg-primary/10 transition-all duration-200',
                  'border border-transparent hover:border-primary/20'
                )}
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <AvatarImage src="" alt={user?.username} />
                  <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
                    {getUserInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-64">
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
                      {getUserInitials(user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {user?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'user@goldshop.com'}
                    </p>
                    <Badge variant="secondary" className="text-xs w-fit">
                      {user?.role?.toString() || 'Owner'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                <User className="mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3 text-muted-foreground" />
                <span>{t('common.profile') || 'Profile Settings'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                <Settings className="mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3 text-muted-foreground" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                <HelpCircle className="mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3 text-muted-foreground" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4 rtl:mr-0 rtl:ml-3" />
                <span>{t('auth.logout') || 'Sign Out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};