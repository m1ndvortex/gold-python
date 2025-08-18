import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { FileText, Download, Printer } from 'lucide-react';
import type { InvoiceWithDetails } from '../../services/invoiceApi';
import type { Customer, InventoryItem } from '../../types';

interface InvoicePreviewProps {
  invoice: InvoiceWithDetails;
  onGeneratePDF?: () => void;
  onPrint?: () => void;
  className?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  onGeneratePDF,
  onPrint,
  className = '',
}) => {
  // Calculate totals
  const subtotal = invoice.invoice_items.reduce((sum, item) => sum + item.total_price, 0);
  const totalWeight = invoice.invoice_items.reduce(
    (sum, item) => sum + (item.weight_grams * item.quantity), 
    0
  );

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'partially_paid':
        return <Badge variant="secondary">Partially Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <Card>
        <CardHeader className="space-y-4">
          {/* Header Actions */}
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Invoice Preview</CardTitle>
              <p className="text-gray-600">Invoice #{invoice.invoice_number}</p>
            </div>
            <div className="flex gap-2">
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
              {onGeneratePDF && (
                <Button variant="outline" size="sm" onClick={onGeneratePDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>
          </div>

          {/* Invoice Status */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {getStatusBadge(invoice.status)}
              <span className="text-sm text-gray-600">
                Created: {format(new Date(invoice.created_at), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                ${invoice.total_amount.toFixed(2)}
              </p>
              {invoice.remaining_amount > 0 && (
                <p className="text-sm text-red-600">
                  Remaining: ${invoice.remaining_amount.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Company & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Info (placeholder) */}
            <div>
              <h3 className="font-semibold text-lg mb-2">From:</h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">Gold Shop Company</p>
                <p>123 Main Street</p>
                <p>City, State 12345</p>
                <p>Phone: (555) 123-4567</p>
                <p>Email: info@goldshop.com</p>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Bill To:</h3>
              {invoice.customer ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{invoice.customer.name}</p>
                  {invoice.customer.phone && <p>Phone: {invoice.customer.phone}</p>}
                  {invoice.customer.email && <p>Email: {invoice.customer.email}</p>}
                  {invoice.customer.address && <p>{invoice.customer.address}</p>}
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-600">
                      Current Debt: ${invoice.customer.current_debt.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Total Purchases: ${invoice.customer.total_purchases.toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Customer information not available</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Gold Price (per gram)</p>
              <p className="font-medium">${invoice.gold_price_per_gram.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Labor Cost</p>
              <p className="font-medium">{invoice.labor_cost_percentage}%</p>
            </div>
            <div>
              <p className="text-gray-600">Profit Margin</p>
              <p className="font-medium">{invoice.profit_percentage}%</p>
            </div>
            <div>
              <p className="text-gray-600">VAT</p>
              <p className="font-medium">{invoice.vat_percentage}%</p>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-center py-2">Weight (g)</th>
                    <th className="text-center py-2">Total Weight (g)</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoice_items.map((item, index) => (
                    <tr key={item.id || index} className="border-b">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">
                            {item.inventory_item?.name || 'Unknown Item'}
                          </p>
                          {item.inventory_item?.description && (
                            <p className="text-gray-600 text-xs">
                              {item.inventory_item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3">{item.quantity}</td>
                      <td className="text-center py-3">{item.weight_grams.toFixed(3)}</td>
                      <td className="text-center py-3">
                        {(item.weight_grams * item.quantity).toFixed(3)}
                      </td>
                      <td className="text-right py-3">${item.unit_price.toFixed(2)}</td>
                      <td className="text-right py-3 font-medium">
                        ${item.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Weight:</span>
                <span className="font-medium">{totalWeight.toFixed(3)}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span className="text-lg">${invoice.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Paid Amount:</span>
                <span>${invoice.paid_amount.toFixed(2)}</span>
              </div>
              {invoice.remaining_amount > 0 && (
                <div className="flex justify-between text-sm text-red-600 font-medium">
                  <span>Remaining:</span>
                  <span>${invoice.remaining_amount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-4">Payment History</h3>
                <div className="space-y-2">
                  {invoice.payments.map((payment, index) => (
                    <div key={payment.id || index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">${payment.amount.toFixed(2)}</p>
                        <p className="text-gray-600">
                          {format(new Date(payment.payment_date), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600">{payment.payment_method}</p>
                        {payment.description && (
                          <p className="text-xs text-gray-500">{payment.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <Separator />
          <div className="text-center text-sm text-gray-600">
            <p>Thank you for your business!</p>
            <p className="text-xs mt-1">
              This invoice was generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};