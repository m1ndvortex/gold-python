import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Receipt, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Target,
  Banknote,
  Eye
} from 'lucide-react';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoicePreview } from '../components/invoices/InvoicePreview';
import { PaymentForm } from '../components/invoices/PaymentForm';
import { PDFGenerator } from '../components/invoices/PDFGenerator';
import { useInvoice, useInvoiceSummary } from '../hooks/useInvoices';
import { cn } from '../lib/utils';
import type { Invoice } from '../types';
import type { InvoiceWithDetails } from '../services/invoiceApi';

export const Invoices: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // API hooks
  const { data: invoiceDetails } = useInvoice(selectedInvoiceId || '');
  const { data: summary } = useInvoiceSummary();

  // Handle create new invoice
  const handleCreateNew = () => {
    setShowCreateDialog(true);
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    setShowPreviewDialog(true);
  };

  // Handle edit invoice
  const handleEditInvoice = (invoice: Invoice) => {
    // For now, just show the create form with initial data
    // In a full implementation, you'd have a separate edit form
    setSelectedInvoice(invoice);
    setShowCreateDialog(true);
  };

  // Handle add payment
  const handleAddPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  // Handle successful invoice creation
  const handleInvoiceCreated = (invoice: InvoiceWithDetails) => {
    setShowCreateDialog(false);
    setSelectedInvoice(null);
    // Optionally show the created invoice
    setSelectedInvoiceId(invoice.id);
    setShowPreviewDialog(true);
  };

  // Handle successful payment
  const handlePaymentAdded = () => {
    setShowPaymentDialog(false);
    setSelectedInvoice(null);
    // Refresh the invoice details if viewing
    if (selectedInvoiceId) {
      // The query will automatically refetch due to invalidation in the hook
    }
  };

  // Close dialogs
  const closeDialogs = () => {
    setShowCreateDialog(false);
    setShowPreviewDialog(false);
    setShowPaymentDialog(false);
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoice Management</h1>
              <p className="text-muted-foreground">Create, manage, and track invoices with professional precision</p>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleCreateNew}
          size="lg"
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Invoice
        </Button>
      </div>

      {/* Enhanced Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Invoices Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-blue-700">Total Invoices</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-blue-900">{summary.total_invoices}</p>
                <p className="text-xs text-blue-600">All-time invoices created</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-emerald-700">Total Value</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-emerald-600">+12%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-emerald-900">${summary.total_amount.toFixed(2)}</p>
                <p className="text-xs text-emerald-600">Total invoice value</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Paid Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-green-700">Payments Received</CardTitle>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {summary.total_paid > 0 ? Math.round((summary.total_paid / summary.total_amount) * 100) : 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-900">${summary.total_paid.toFixed(2)}</p>
                <Progress 
                  value={summary.total_paid > 0 ? (summary.total_paid / summary.total_amount) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Amount Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm font-medium text-amber-700">Outstanding</CardTitle>
                </div>
                <Badge 
                  variant={summary.total_remaining > (summary.total_amount * 0.3) ? "destructive" : "secondary"}
                  className={cn(
                    summary.total_remaining > (summary.total_amount * 0.3) 
                      ? "bg-red-100 text-red-700 hover:bg-red-100" 
                      : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  {summary.total_remaining > (summary.total_amount * 0.3) ? "High" : "Normal"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-amber-900">${summary.total_remaining.toFixed(2)}</p>
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>Requires attention</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Main Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-1">
                <TabsTrigger 
                  value="list" 
                  className="flex items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary-500"
                >
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Invoice Management</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary-500"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Analytics & Reports</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value="list" className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">All Invoices</h3>
                    <p className="text-sm text-muted-foreground">Manage and track all your invoices in one place</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Real-time Updates
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <InvoiceList
                  onCreateNew={handleCreateNew}
                  onViewInvoice={handleViewInvoice}
                  onEditInvoice={handleEditInvoice}
                  onAddPayment={handleAddPayment}
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="p-6 space-y-6">
              <div className="space-y-6">
                {/* Analytics Header */}
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-indigo-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Invoice Analytics</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Comprehensive insights and reports on your invoice performance and revenue trends
                    </p>
                  </div>
                </div>

                {/* Coming Soon Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary-300 transition-colors">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <TrendingUp className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Revenue Trends</h4>
                        <p className="text-sm text-muted-foreground">Track invoice revenue over time</p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary-300 transition-colors">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Payment Analysis</h4>
                        <p className="text-sm text-muted-foreground">Analyze payment patterns and delays</p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary-300 transition-colors">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                        <Banknote className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Profit Margins</h4>
                        <p className="text-sm text-muted-foreground">Track profitability by product and period</p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Cards */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-primary-900">Enhanced Analytics Coming Soon</h4>
                      <p className="text-sm text-primary-700 mt-1">
                        We're working on powerful analytics features to help you gain deeper insights into your business performance.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Request Feature
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modern Create/Edit Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="space-y-3 pb-6 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedInvoice ? 'Modify invoice details and items' : 'Generate a professional invoice with automatic calculations'}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="pt-6">
            <InvoiceForm
              onSuccess={handleInvoiceCreated}
              onCancel={closeDialogs}
              initialData={selectedInvoice ? {
                customer_id: selectedInvoice.customer_id,
                gold_price_per_gram: selectedInvoice.gold_price_per_gram,
                labor_cost_percentage: selectedInvoice.labor_cost_percentage,
                profit_percentage: selectedInvoice.profit_percentage,
                vat_percentage: selectedInvoice.vat_percentage,
              } : undefined}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Invoice Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto border-0 shadow-2xl">
          <DialogHeader className="space-y-3 pb-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-foreground">Invoice Preview</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review invoice details and generate PDF or print
                  </p>
                </div>
              </div>
              {invoiceDetails && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {invoiceDetails.status?.toUpperCase() || 'DRAFT'}
                  </Badge>
                  <PDFGenerator
                    invoice={invoiceDetails}
                    onGenerated={(blob) => {
                      console.log('PDF generated:', blob);
                    }}
                  />
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="pt-6">
            {invoiceDetails && (
              <InvoicePreview
                invoice={invoiceDetails}
                onGeneratePDF={() => {
                  // PDF generation is handled by the PDFGenerator component
                }}
                onPrint={() => {
                  window.print();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modern Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg border-0 shadow-xl">
          <DialogHeader className="space-y-3 pb-6 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">Record Payment</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a payment towards this invoice
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="pt-6">
            {selectedInvoice && (
              <PaymentForm
                invoice={selectedInvoice}
                onSuccess={handlePaymentAdded}
                onCancel={closeDialogs}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};