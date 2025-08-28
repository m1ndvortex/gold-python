import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useDashboard } from '../hooks/useDashboard';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const {
    summaryData,
    salesChartData,
    categoryData,
    topProducts,
    lowStockItems,
    unpaidInvoices,
    isLoading,
    hasError,
    refreshAll
  } = useDashboard();

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
      {/* Header with enhanced gradient styling */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50/50 via-teal-50/50 to-blue-50/50 rounded-2xl shadow-lg border border-green-100/50">
        <div className="flex items-center space-x-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-xl">
            <div className="h-8 w-8 rounded-xl bg-white/30 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-white/60"></div>
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{t('nav.dashboard')}</h1>
            <p className="text-base text-gray-600 mt-2 font-medium">{t('dashboard.welcome_message')}</p>
          </div>
        </div>
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

      {/* Summary Cards */}
      <SummaryCards
        data={summaryData || null}
        isLoading={isLoading}
        onCardClick={handleCardClick}
      />

      {/* Charts Section */}
      <DashboardCharts
        salesData={salesChartData || null}
        categoryData={categoryData || null}
        topProducts={topProducts || null}
        isLoading={isLoading}
        onRefresh={refreshAll}
      />

      {/* Alerts Panel */}
      <AlertsPanel
        lowStockItems={lowStockItems || null}
        unpaidInvoices={unpaidInvoices || null}
        isLoading={isLoading}
        onLowStockClick={handleLowStockClick}
        onInvoiceClick={handleInvoiceClick}
      />
    </div>
  );
};