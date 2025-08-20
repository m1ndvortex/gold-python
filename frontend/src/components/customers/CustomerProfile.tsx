import React, { useState } from 'react';
import { X, Edit, Phone, Mail, MapPin, DollarSign, Calendar, CreditCard, History, User, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DataTable, DataTableColumn } from '../ui/data-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useCustomer, useCustomerDebtHistory, useCustomerPayments } from '../../hooks/useCustomers';
import { ComprehensiveCustomerForm } from './ComprehensiveCustomerForm';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl mx-auto max-h-[95vh] overflow-hidden shadow-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-primary-900">
                  {displayCustomer.name}
                </CardTitle>
                <p className="text-primary-700 font-medium">
                  Customer ID: {displayCustomer.id.slice(0, 8)}...
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge 
                    variant={displayCustomer.current_debt > 0 ? 'destructive' : 'default'}
                    className="font-medium"
                  >
                    {displayCustomer.current_debt > 0 ? 'Has Outstanding Debt' : 'Account Clear'}
                  </Badge>
                  <span className="text-sm text-primary-600">
                    Member since {formatDate(displayCustomer.created_at || new Date().toISOString())}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
                className="border-primary-300 text-primary-700 hover:bg-primary-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-primary-600 hover:text-primary-800 hover:bg-primary-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Professional Customer Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-l-success-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                    <p className="text-3xl font-bold text-success-700">
                      {formatCurrency(displayCustomer.total_purchases)}
                    </p>
                    <p className="text-xs text-success-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Lifetime value
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${
              displayCustomer.current_debt > 0 
                ? 'border-l-error-500' 
                : 'border-l-success-500'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Current Debt</p>
                    <p className={`text-3xl font-bold ${
                      displayCustomer.current_debt > 0 
                        ? 'text-error-700' 
                        : 'text-success-700'
                    }`}>
                      {formatCurrency(displayCustomer.current_debt)}
                    </p>
                    <p className={`text-xs flex items-center ${
                      displayCustomer.current_debt > 0 
                        ? 'text-error-600' 
                        : 'text-success-600'
                    }`}>
                      {displayCustomer.current_debt > 0 ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Requires attention
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Account clear
                        </>
                      )}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    displayCustomer.current_debt > 0 
                      ? 'bg-error-100' 
                      : 'bg-success-100'
                  }`}>
                    <CreditCard className={`h-6 w-6 ${
                      displayCustomer.current_debt > 0 
                        ? 'text-error-600' 
                        : 'text-success-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-info-500 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Last Purchase</p>
                    <p className="text-2xl font-bold text-info-700">
                      {displayCustomer.last_purchase_date 
                        ? formatDate(displayCustomer.last_purchase_date)
                        : 'Never'
                      }
                    </p>
                    <p className="text-xs text-info-600">
                      {displayCustomer.last_purchase_date 
                        ? `${Math.floor((Date.now() - new Date(displayCustomer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                        : 'No purchases yet'
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-info-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-info-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Contact Information */}
          <Card className="mb-8 shadow-sm">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                <Phone className="h-5 w-5 text-primary-600" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayCustomer.phone ? (
                  <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="font-semibold text-foreground">{displayCustomer.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="text-muted-foreground">Not provided</p>
                    </div>
                  </div>
                )}
                
                {displayCustomer.email ? (
                  <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                      <p className="font-semibold text-foreground">{displayCustomer.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                      <p className="text-muted-foreground">Not provided</p>
                    </div>
                  </div>
                )}
                
                {displayCustomer.address && (
                  <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-lg md:col-span-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="font-semibold text-foreground">{displayCustomer.address}</p>
                    </div>
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
          <ComprehensiveCustomerForm
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