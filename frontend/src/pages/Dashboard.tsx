import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { WithPermissions } from '../components/auth/WithPermissions';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { Button } from '../components/ui/button';
import { RefreshCw, Shield, User, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading: authLoading, error: authError } = useAuth();
  const { 
    canViewDashboard, 
    canViewAccounting, 
    canManageInventory, 
    canManageCustomers,
    canViewReports,
    canViewAnalytics,
    hasPermission
  } = usePermissions();
  
  const {
    summaryData,
    salesChartData,
    categoryData,
    topProducts,
    lowStockItems,
    unpaidInvoices,
    isLoading: dashboardLoading,
    hasError,
    refreshAll
  } = useDashboard();

  // Combine loading states
  const isLoading = authLoading || dashboardLoading;

  const handleCardClick = (section: string) => {
    switch (section) {
      case 'sales':
        navigate('/invoices');
        break;
      case 'inventory':
        navigate('/inventory');
        break;
      case 'customers':
        navigate('/customers');
        break;
      default:
        break;
    }
  };

  const handleLowStockClick = (itemId: string) => {
    navigate(`/inventory?item=${itemId}`);
  };

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/invoices?invoice=${invoiceId}`);
  };

  const handleRefresh = () => {
    refreshAll();
  };

  // Authentication error handling
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 p-8 bg-gradient-to-br from-red-50/30 via-white to-red-50/20 rounded-2xl">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl mb-4">
          <AlertTriangle className="w-10 h-10 text-white" />
        </div>
        <p className="text-xl text-gray-700 font-medium">{t('auth.authentication_error')}</p>
        <p className="text-gray-600 text-center max-w-md">{authError}</p>
        <Button 
          onClick={() => window.location.reload()} 
          size="lg"
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3"
        >
          <RefreshCw className="w-5 h-5 mr-3" />
          {t('common.reload_page')}
        </Button>
      </div>
    );
  }

  // Check if user has permission to view dashboard
  if (isAuthenticated && !canViewDashboard()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 p-8 bg-gradient-to-br from-orange-50/30 via-white to-orange-50/20 rounded-2xl">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl mb-4">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <p className="text-xl text-gray-700 font-medium">{t('auth.access_denied')}</p>
        <p className="text-gray-600 text-center max-w-md">{t('auth.dashboard_access_required')}</p>
        <Button 
          onClick={() => navigate('/settings')} 
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3"
        >
          <User className="w-5 h-5 mr-3" />
          {t('nav.settings')}
        </Button>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 p-8 bg-gradient-to-br from-green-50/30 via-white to-teal-50/20 rounded-2xl">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-xl mb-4">
          <RefreshCw className="w-10 h-10 text-white" />
        </div>
        <p className="text-xl text-gray-700 font-medium">{t('dashboard.error_loading')}</p>
        <Button 
          onClick={handleRefresh} 
          size="lg"
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-3"
        >
          <RefreshCw className="w-5 h-5 mr-3" />
          {t('common.try_again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/20 min-h-screen">
      {/* Header with enhanced gradient styling and user info */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50/50 via-teal-50/50 to-blue-50/50 rounded-2xl shadow-lg border border-green-100/50">
        <div className="flex items-center space-x-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-xl">
            <div className="h-8 w-8 rounded-xl bg-white/30 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-white/60"></div>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{t('nav.dashboard')}</h1>
            <p className="text-base text-gray-600 mt-2 font-medium">
              {user ? t('dashboard.welcome_user', { name: user.first_name || user.username }) : t('dashboard.welcome_message')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {user && (
            <div className="text-right mr-4">
              <p className="text-sm font-medium text-gray-700">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="lg"
            disabled={isLoading}
            className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200 hover:from-green-100 hover:to-teal-100 hover:border-green-300 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <RefreshCw className={`w-5 h-5 mr-3 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Summary Cards with permission-based rendering */}
      <WithPermissions 
        permissions={['dashboard:view']} 
        fallback={
          <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
            <p className="text-orange-700 font-medium">{t('auth.summary_access_required')}</p>
          </div>
        }
      >
        <SummaryCards
          data={summaryData || null}
          isLoading={isLoading}
          onCardClick={handleCardClick}
        />
      </WithPermissions>

      {/* Charts Section with permission-based rendering */}
      <WithPermissions 
        anyPermission={['reports:view', 'analytics:view']} 
        fallback={
          <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <p className="text-blue-700 font-medium">{t('auth.charts_access_required')}</p>
          </div>
        }
      >
        <DashboardCharts
          salesData={salesChartData || null}
          categoryData={categoryData || null}
          topProducts={topProducts || null}
          isLoading={isLoading}
          onRefresh={refreshAll}
        />
      </WithPermissions>

      {/* Alerts Panel with permission-based rendering */}
      <WithPermissions 
        anyPermission={['inventory:view', 'invoices:view', 'dashboard:alerts']} 
        fallback={
          <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <p className="text-purple-700 font-medium">{t('auth.alerts_access_required')}</p>
          </div>
        }
      >
        <AlertsPanel
          lowStockItems={lowStockItems || null}
          unpaidInvoices={unpaidInvoices || null}
          isLoading={isLoading}
          onLowStockClick={handleLowStockClick}
          onInvoiceClick={handleInvoiceClick}
        />
      </WithPermissions>
    </div>
  );
};