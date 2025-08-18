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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-gray-600">Failed to load dashboard data</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('nav.dashboard')}</h1>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
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