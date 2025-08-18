import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DashboardSummary } from '../../types';
import { TrendingUp, TrendingDown, Package, Users, DollarSign, Coins } from 'lucide-react';

interface SummaryCardsProps {
  data: DashboardSummary | null;
  isLoading: boolean;
  onCardClick: (section: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, isLoading, onCardClick }) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(percentage).toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Sales Today */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('sales')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Sales Today
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.total_sales_today)}</div>
          <p className="text-xs text-muted-foreground">
            Week: {formatCurrency(data.total_sales_week)} | Month: {formatCurrency(data.total_sales_month)}
          </p>
        </CardContent>
      </Card>

      {/* Inventory Value */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('inventory')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Inventory Value
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.total_inventory_value)}</div>
          <p className="text-xs text-muted-foreground">
            {data.low_stock_count > 0 && (
              <span className="text-orange-600">
                {data.low_stock_count} items low stock
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Customer Debt */}
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onCardClick('customers')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Customer Debt
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.total_customer_debt)}</div>
          <p className="text-xs text-muted-foreground">
            {data.unpaid_invoices_count > 0 && (
              <span className="text-red-600">
                {data.unpaid_invoices_count} unpaid invoices
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Gold Price */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Gold Price (per gram)
          </CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.current_gold_price)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercentage(data.gold_price_change)} from last week
          </p>
        </CardContent>
      </Card>
    </div>
  );
};