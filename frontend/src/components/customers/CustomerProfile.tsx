import React, { useState } from 'react';
import { X, Edit, Phone, Mail, MapPin, DollarSign, Calendar, CreditCard, History } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useCustomer, useCustomerDebtHistory, useCustomerPayments } from '../../hooks/useCustomers';
import { CustomerForm } from './CustomerForm';
import { PaymentForm } from './PaymentForm';
import type { Customer } from '../../types';

interface CustomerProfileProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer: initialCustomer,
  onClose
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Fetch detailed customer data
  const { data: customer, isLoading } = useCustomer(initialCustomer.id);
  const { data: debtHistory } = useCustomerDebtHistory(initialCustomer.id);
  const { data: payments } = useCustomerPayments(initialCustomer.id);

  const displayCustomer = customer || initialCustomer;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl">{displayCustomer.name}</CardTitle>
            <p className="text-muted-foreground">Customer Profile</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditForm(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Customer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Total Purchases</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(displayCustomer.total_purchases)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Current Debt</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(displayCustomer.current_debt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Last Purchase</p>
                    <p className="text-lg font-semibold">
                      {displayCustomer.last_purchase_date 
                        ? formatDate(displayCustomer.last_purchase_date)
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayCustomer.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{displayCustomer.phone}</span>
                  </div>
                )}
                {displayCustomer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{displayCustomer.email}</span>
                  </div>
                )}
                {displayCustomer.address && (
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{displayCustomer.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>   
       {/* Debt Management */}
          {displayCustomer.current_debt > 0 && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Debt Management</span>
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowPaymentForm(true)}
                >
                  Record Payment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm text-red-600">Outstanding Debt</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(displayCustomer.current_debt)}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    Requires Payment
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for detailed information */}
          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payments">Payment History</TabsTrigger>
              <TabsTrigger value="debt-history">Debt History</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {!payments || payments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No payments recorded yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Invoice</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {formatDateTime(payment.payment_date)}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.payment_method}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {payment.description || '-'}
                              </TableCell>
                              <TableCell>
                                {payment.invoice_id ? (
                                  <Badge variant="secondary">
                                    {payment.invoice_id.slice(0, 8)}...
                                  </Badge>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="debt-history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Debt History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!debtHistory || debtHistory.debt_history.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No debt history available.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Running Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {debtHistory.debt_history.map((entry, index) => (
                            <TableRow key={`${entry.type}-${entry.id}-${index}`}>
                              <TableCell>
                                {formatDateTime(entry.date)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={entry.type === 'invoice' ? 'destructive' : 'default'}>
                                  {entry.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{entry.description}</TableCell>
                              <TableCell>
                                <span className={entry.amount > 0 ? 'text-red-600' : 'text-green-600'}>
                                  {entry.amount > 0 ? '+' : ''}
                                  {formatCurrency(Math.abs(entry.amount))}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {formatCurrency(entry.running_balance)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-4">
                    Invoice history will be available when invoice management is implemented.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Edit Customer Form */}
        {showEditForm && (
          <CustomerForm
            customer={displayCustomer}
            onClose={() => setShowEditForm(false)}
            onSuccess={() => setShowEditForm(false)}
          />
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <PaymentForm
            customer={displayCustomer}
            onClose={() => setShowPaymentForm(false)}
            onSuccess={() => setShowPaymentForm(false)}
          />
        )}
      </Card>
    </div>
  );
};