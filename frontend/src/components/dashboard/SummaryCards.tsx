import React from 'react';
import { DashboardSummary } from '../../types';
import { Package, Users, DollarSign, Coins, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useLanguage } from '../../hooks/useLanguage';
import { usePermissions } from '../../hooks/usePermissions';
import { WithPermissions } from '../auth/WithPermissions';

interface SummaryCardsProps {
  data: DashboardSummary | null;
  isLoading: boolean;
  onCardClick: (section: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, isLoading, onCardClick }) => {
  const { t } = useLanguage();
  const { hasPermission, canViewAccounting, canManageInventory, canManageCustomers } = usePermissions();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate mock trend data for demonstration
  const generateTrendData = (baseValue: number, volatility: number = 0.1) => {
    return Array.from({ length: 7 }, (_, i) => {
      const variation = (Math.random() - 0.5) * volatility;
      return baseValue * (1 + variation);
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <MetricCard
            key={i}
            title=""
            value=""
            icon={DollarSign}
            color="gold"
            isLoading={true}
          />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="col-span-full flex items-center justify-center p-8 text-gray-500">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {t('dashboard.no_data_available')}
        </div>
      </div>
    );
  }

  // Calculate sales growth (mock calculation for demo)
  const salesGrowth = data.total_sales_week > 0 
    ? ((data.total_sales_today * 7 - data.total_sales_week) / data.total_sales_week) * 100 
    : 0;

  // Calculate inventory status
  const inventoryStatus = data.low_stock_count > 0 ? 'warning' : 'normal';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Sales Today - requires sales view permission */}
      <WithPermissions 
        anyPermission={['sales:view', 'invoices:view', 'dashboard:sales']}
        fallback={
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
            <p className="text-gray-500 text-sm">{t('auth.sales_access_required')}</p>
          </div>
        }
      >
        <MetricCard
          title={t('dashboard.total_sales_today')}
          value={formatCurrency(data.total_sales_today)}
          change={{
            value: Math.abs(salesGrowth),
            type: salesGrowth >= 0 ? 'increase' : 'decrease',
            period: t('dashboard.vs_last_week')
          }}
          icon={DollarSign}
          color="gold"
          trend={generateTrendData(data.total_sales_today, 0.15)}
          onClick={() => onCardClick('sales')}
          subtitle={`${t('dashboard.week')}: ${formatCurrency(data.total_sales_week)} | ${t('dashboard.month')}: ${formatCurrency(data.total_sales_month)}`}
        />
      </WithPermissions>

      {/* Inventory Value - requires inventory view permission */}
      <WithPermissions 
        anyPermission={['inventory:view', 'dashboard:inventory']}
        fallback={
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
            <p className="text-gray-500 text-sm">{t('auth.inventory_access_required')}</p>
          </div>
        }
      >
        <MetricCard
          title={t('dashboard.inventory_value')}
          value={formatCurrency(data.total_inventory_value)}
          icon={Package}
          color={inventoryStatus === 'warning' ? 'red' : 'blue'}
          trend={generateTrendData(data.total_inventory_value, 0.05)}
          onClick={() => canManageInventory() ? onCardClick('inventory') : undefined}
          subtitle={data.low_stock_count > 0 ? `${data.low_stock_count} ${t('dashboard.items_low_stock')}` : t('dashboard.stock_levels_healthy')}
          badge={data.low_stock_count > 0 ? t('dashboard.low_stock') : undefined}
        />
      </WithPermissions>

      {/* Customer Debt - requires customer or accounting view permission */}
      <WithPermissions 
        anyPermission={['customers:view', 'accounting:view', 'dashboard:financials']}
        fallback={
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center justify-center">
            <p className="text-gray-500 text-sm">{t('auth.customer_access_required')}</p>
          </div>
        }
      >
        <MetricCard
          title={t('dashboard.customer_debt')}
          value={formatCurrency(data.total_customer_debt)}
          icon={Users}
          color={data.unpaid_invoices_count > 0 ? 'red' : 'green'}
          trend={generateTrendData(data.total_customer_debt, 0.08)}
          onClick={() => canManageCustomers() ? onCardClick('customers') : undefined}
          subtitle={data.unpaid_invoices_count > 0 ? `${data.unpaid_invoices_count} ${t('dashboard.unpaid_invoices')}` : t('dashboard.all_invoices_current')}
          badge={data.unpaid_invoices_count > 0 ? t('dashboard.overdue') : undefined}
        />
      </WithPermissions>

      {/* Gold Price - always visible as it's market data */}
      <MetricCard
        title={t('dashboard.gold_price_per_gram')}
        value={formatCurrency(data.current_gold_price)}
        change={{
          value: Math.abs(data.gold_price_change),
          type: data.gold_price_change >= 0 ? 'increase' : 'decrease',
          period: t('dashboard.from_last_week')
        }}
        icon={Coins}
        color="gold"
        trend={generateTrendData(data.current_gold_price, 0.03)}
        subtitle={t('dashboard.market_rate')}
      />
    </div>
  );
};