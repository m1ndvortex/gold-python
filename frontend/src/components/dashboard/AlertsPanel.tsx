import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { LowStockItem, UnpaidInvoice } from '../../types';
import { AlertTriangle, Clock, Package, CreditCard } from 'lucide-react';

interface AlertsPanelProps {
  lowStockItems: LowStockItem[] | null;
  unpaidInvoices: UnpaidInvoice[] | null;
  isLoading: boolean;
  onLowStockClick: (itemId: string) => void;
  onInvoiceClick: (invoiceId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  lowStockItems,
  unpaidInvoices,
  isLoading,
  onLowStockClick,
  onInvoiceClick
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatusColor = (status: 'critical' | 'warning') => {
    return status === 'critical' ? 'destructive' : 'secondary';
  };

  const getOverdueStatusColor = (days: number) => {
    if (days > 30) return 'destructive';
    if (days > 7) return 'secondary';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center space-x-4">
                    <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>
            Items that need restocking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockItems && lowStockItems.length > 0 ? (
            <div className="space-y-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.item_id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onLowStockClick(item.item_id)}
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle 
                      className={`w-4 h-4 ${
                        item.status === 'critical' ? 'text-red-500' : 'text-orange-500'
                      }`} 
                    />
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {item.item_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.category_name} • Stock: {item.current_stock} / Min: {item.min_stock_level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStockStatusColor(item.status)}>
                      {item.status === 'critical' ? 'Critical' : 'Low Stock'}
                    </Badge>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    All items are adequately stocked.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                No low stock alerts at this time.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Unpaid Invoices
          </CardTitle>
          <CardDescription>
            Outstanding customer payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unpaidInvoices && unpaidInvoices.length > 0 ? (
            <div className="space-y-4">
              {unpaidInvoices.map((invoice) => (
                <div
                  key={invoice.invoice_id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onInvoiceClick(invoice.invoice_id)}
                >
                  <div className="flex items-center space-x-3">
                    <Clock 
                      className={`w-4 h-4 ${
                        invoice.days_overdue > 30 ? 'text-red-500' : 
                        invoice.days_overdue > 7 ? 'text-orange-500' : 'text-blue-500'
                      }`} 
                    />
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.customer_name} • {formatCurrency(invoice.remaining_amount)} remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getOverdueStatusColor(invoice.days_overdue)}>
                      {invoice.days_overdue} days
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                No unpaid invoices at this time.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};