import React from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../hooks/useLanguage';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BreadcrumbNav } from './BreadcrumbNav';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  const { direction } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const isRTL = direction === 'rtl';

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle responsive sidebar behavior
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className={cn(
        'min-h-screen bg-background flex',
        isRTL && 'rtl',
        className
      )}
      dir={direction}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          isSidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={toggleSidebar}
        />

        {/* Breadcrumb Navigation */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-3">
            <BreadcrumbNav />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};