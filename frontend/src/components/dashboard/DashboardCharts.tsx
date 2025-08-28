import React from 'react';
import { ModernChart } from './ModernChart';
import { SalesChartData, CategorySalesData, TopProduct } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { usePermissions } from '../../hooks/usePermissions';
import { WithPermissions } from '../auth/WithPermissions';

interface DashboardChartsProps {
  salesData: SalesChartData | null;
  categoryData: CategorySalesData[] | null;
  topProducts: TopProduct[] | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  salesData,
  categoryData,
  topProducts,
  isLoading,
  onRefresh
}) => {
  const { t } = useLanguage();
  const { hasPermission, canViewReports, canViewAnalytics } = usePermissions();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare chart data with enhanced formatting
  const getSalesChartData = () => {
    if (!salesData) return { labels: [], datasets: [] };
    
    return {
      ...salesData,
      datasets: salesData.datasets.map(dataset => ({
        ...dataset,
        label: dataset.label || 'Sales',
        tension: 0.4,
      }))
    };
  };

  const getCategoryChartData = () => {
    if (!categoryData || categoryData.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: categoryData.map(cat => cat.category_name),
      datasets: [
        {
          label: 'Sales by Category',
          data: categoryData.map(cat => cat.total_sales),
        },
      ],
    };
  };

  const getTopProductsChartData = () => {
    if (!topProducts || topProducts.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: topProducts.map(product => 
        product.item_name.length > 15 
          ? product.item_name.substring(0, 15) + '...' 
          : product.item_name
      ),
      datasets: [
        {
          label: 'Revenue',
          data: topProducts.map(product => product.total_revenue),
        },
      ],
    };
  };

  // Custom options for different chart types
  const categoryChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = categoryData?.reduce((sum, cat) => sum + cat.total_sales, 0) || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <ModernChart
            key={i}
            type="line"
            data={{ labels: [], datasets: [] }}
            title={t('common.loading')}
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sales Trend Chart - requires sales or reports view permission */}
      <WithPermissions 
        anyPermission={['sales:view', 'reports:view', 'analytics:view']}
        fallback={
          <div className="lg:col-span-2 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
            <p className="text-gray-500">{t('auth.sales_reports_access_required')}</p>
          </div>
        }
      >
        <ModernChart
          type="line"
          data={getSalesChartData()}
          title={t('dashboard.sales_trends')}
          description={t('dashboard.sales_trends_desc')}
          className="lg:col-span-2"
          height={320}
          onRefresh={canViewReports() ? onRefresh : undefined}
          showExport={canViewReports()}
          showFullscreen={true}
        />
      </WithPermissions>

      {/* Category Sales Chart - requires inventory or sales view permission */}
      <WithPermissions 
        anyPermission={['inventory:view', 'sales:view', 'reports:view']}
        fallback={
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
            <p className="text-gray-500">{t('auth.category_reports_access_required')}</p>
          </div>
        }
      >
        <ModernChart
          type="doughnut"
          data={getCategoryChartData()}
          title={t('dashboard.sales_by_category')}
          description={t('dashboard.sales_by_category_desc')}
          height={320}
          onRefresh={canViewReports() ? onRefresh : undefined}
          showExport={canViewReports()}
          showFullscreen={true}
          customOptions={categoryChartOptions}
        />
      </WithPermissions>

      {/* Top Products Chart - requires inventory or sales view permission */}
      <WithPermissions 
        anyPermission={['inventory:view', 'sales:view', 'reports:view']}
        fallback={
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
            <p className="text-gray-500">{t('auth.product_reports_access_required')}</p>
          </div>
        }
      >
        <ModernChart
          type="bar"
          data={getTopProductsChartData()}
          title={t('dashboard.top_products')}
          description={t('dashboard.top_products_desc')}
          height={320}
          onRefresh={canViewReports() ? onRefresh : undefined}
          showExport={canViewReports()}
          showFullscreen={true}
        />
      </WithPermissions>
    </div>
  );
};