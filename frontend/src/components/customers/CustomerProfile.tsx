import React, { useState } from 'react';
import { X, Edit, Phone, Mail, MapPin, DollarSign, Calendar, CreditCard, History, User, TrendingUp, AlertTriangle, ImageIcon, FileText, Lock, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DataTable, DataTableColumn } from '../ui/data-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useCustomer, useCustomerDebtHistory, useCustomerPayments } from '../../hooks/useCustomers';
import { useAuth } from '../../hooks/useAuth';
import { WithPermissions } from '../auth/WithPermissions';
import { ComprehensiveCustomerForm } from './ComprehensiveCustomerForm';
import { PaymentForm } from './PaymentForm';
import { ImageGallery } from '../image-management/ImageGallery';
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
  const { user, hasPermission, isAuthenticated } = useAuth();

  // Check permissions
  const canEditCustomers = hasPermission('edit_customers');
  const canManagePayments = hasPermission('manage_payments');

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
        <CardHeader className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {displayCustomer.name}
                </CardTitle>
                <p className="text-muted-foreground font-medium">
                  Customer ID: {displayCustomer.id.slice(0, 8)}...
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge 
                    variant={displayCustomer.current_debt > 0 ? 'destructive' : 'default'}
                    className={`font-medium ${
                      displayCustomer.current_debt > 0 
                        ? 'bg-red-100 text-red-700 border-red-200' 
                        : 'bg-green-100 text-green-700 border-green-200'
                    }`}
                  >
                    {displayCustomer.current_debt > 0 ? 'Has Outstanding Debt' : 'Account Clear'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Member since {formatDate(displayCustomer.created_at || new Date().toISOString())}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <WithPermissions permissions={['edit_customers']}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditForm(true)}
                  className="bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </WithPermissions>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-white/50"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] bg-gradient-to-br from-green-50/30 to-white">
          {/* Enhanced Customer Summary Cards with Gradient Styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatCurrency(displayCustomer.total_purchases)}
                    </p>
                    <p className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Lifetime value
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              displayCustomer.current_debt > 0 
                ? 'bg-gradient-to-br from-red-50 to-pink-100/50' 
                : 'bg-gradient-to-br from-blue-50 to-indigo-100/50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Current Debt</p>
                    <p className={`text-3xl font-bold ${
                      displayCustomer.current_debt > 0 
                        ? 'text-red-700' 
                        : 'text-blue-700'
                    }`}>
                      {formatCurrency(displayCustomer.current_debt)}
                    </p>
                    <p className={`text-xs flex items-center ${
                      displayCustomer.current_debt > 0 
                        ? 'text-red-600' 
                        : 'text-blue-600'
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                    displayCustomer.current_debt > 0 
                      ? 'bg-red-100' 
                      : 'bg-blue-100'
                  }`}>
                    <CreditCard className={`h-6 w-6 ${
                      displayCustomer.current_debt > 0 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100/50 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Last Purchase</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {displayCustomer.last_purchase_date 
                        ? formatDate(displayCustomer.last_purchase_date)
                        : 'Never'
                      }
                    </p>
                    <p className="text-xs text-purple-600">
                      {displayCustomer.last_purchase_date 
                        ? `${Math.floor((Date.now() - new Date(displayCustomer.last_purchase_date).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                        : 'No purchases yet'
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shadow-sm">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Contact Information with Gradient Styling */}
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">Contact Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Customer contact details and preferences</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayCustomer.phone ? (
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg border border-green-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-sm">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="font-semibold text-foreground">{displayCustomer.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="text-muted-foreground">Not provided</p>
                    </div>
                  </div>
                )}
                
                {displayCustomer.email ? (
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                      <p className="font-semibold text-foreground">{displayCustomer.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                      <p className="text-muted-foreground">Not provided</p>
                    </div>
                  </div>
                )}
                
                {displayCustomer.address && (
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg border border-purple-200 md:col-span-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center shadow-sm">
                      <MapPin className="h-5 w-5 text-purple-600" />
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

          {/* Enhanced Tabs with Gradient Styling */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <Tabs defaultValue="payments" className="w-full">
                {/* Modern Tab Navigation */}
                <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200">
                  <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
                    <TabsTrigger 
                      value="payments" 
                      className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
                    >
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">Payment History</div>
                        <div className="text-xs text-muted-foreground">Transaction records</div>
                      </div>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="debt-history" 
                      className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300"
                    >
                      <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <History className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">Debt History</div>
                        <div className="text-xs text-muted-foreground">Balance changes</div>
                      </div>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="invoices" 
                      className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">Invoices</div>
                        <div className="text-xs text-muted-foreground">Purchase records</div>
                      </div>
                    </TabsTrigger>
                    
                    <TabsTrigger 
                      value="images" 
                      className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">Images</div>
                        <div className="text-xs text-muted-foreground">Media gallery</div>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab Content with Enhanced Layout */}
                <TabsContent value="payments" className="p-0">
                  <div className="p-6 space-y-6 bg-gradient-to-br from-green-50/30 to-white">
                    {/* Tab Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">Payment History</h3>
                          <p className="text-sm text-muted-foreground">Track all customer payments and transactions</p>
                        </div>
                      </div>
                    </div>
                    
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
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
                  </div>
                </TabsContent>

                <TabsContent value="debt-history" className="p-0">
                  <div className="p-6 space-y-6 bg-gradient-to-br from-teal-50/30 to-white">
                    {/* Tab Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                          <History className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">Debt History</h3>
                          <p className="text-sm text-muted-foreground">Monitor debt changes and balance history</p>
                        </div>
                      </div>
                    </div>
                    
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
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
                  </div>
                </TabsContent>

                <TabsContent value="invoices" className="p-0">
                  <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-white">
                    {/* Tab Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">Recent Invoices</h3>
                          <p className="text-sm text-muted-foreground">View customer purchase invoices and records</p>
                        </div>
                      </div>
                    </div>
                    
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-4">
                    Invoice history will be available when invoice management is implemented.
                  </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="p-0">
                  <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-white">
                    {/* Tab Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">Customer Images</h3>
                          <p className="text-sm text-muted-foreground">Manage images and documents related to this customer</p>
                        </div>
                      </div>
                    </div>
                    
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                  <ImageGallery
                    entityType="customer"
                    entityId={displayCustomer.id}
                    viewMode="grid"
                    enableReorder={true}
                    enableZoom={true}
                    enableFullscreen={true}
                    maxImages={20}
                    className="mt-4"
                  />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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