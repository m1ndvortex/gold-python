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
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
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
          className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Invoice
        </Button>
      </div>

      {/* Enhanced Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Invoices Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium text-blue-700">Total Invoices</CardTitle>
                </div>
                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0 shadow-sm">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{summary.total_invoices}</p>
                <p className="text-xs text-blue-600">All-time invoices created</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium text-emerald-700">Total Value</CardTitle>
                </div>
                <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-100 to-teal-100 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs text-emerald-600 font-medium">+12%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">${summary.total_amount.toFixed(2)}</p>
                <p className="text-xs text-emerald-600">Total invoice value</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Paid Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium text-green-700">Payments Received</CardTitle>
                </div>
                <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-0 shadow-sm">
                  {summary.total_paid > 0 ? Math.round((summary.total_paid / summary.total_amount) * 100) : 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${summary.total_paid.toFixed(2)}</p>
                <Progress 
                  value={summary.total_paid > 0 ? (summary.total_paid / summary.total_amount) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Amount Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium text-amber-700">Outstanding</CardTitle>
                </div>
                <Badge 
                  className={cn(
                    summary.total_remaining > (summary.total_amount * 0.3) 
                      ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-0 shadow-sm" 
                      : "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-0 shadow-sm"
                  )}
                >
                  {summary.total_remaining > (summary.total_amount * 0.3) ? "High" : "Normal"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">${summary.total_remaining.toFixed(2)}</p>
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
      <Card className="border-0 shadow-lg bg-white">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-gradient-to-r from-green-50 via-teal-50 to-blue-50">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-1">
                <TabsTrigger 
                  value="list" 
                  className="flex items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300 rounded-lg m-1 transition-all duration-300"
                >
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Invoice Management</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300 rounded-lg m-1 transition-all duration-300"
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
                  <Card className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-teal-100/30">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-800">Revenue Trends</h4>
                        <p className="text-sm text-emerald-600">Track invoice revenue over time</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0">Coming Soon</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-100/30">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-800">Payment Analysis</h4>
                        <p className="text-sm text-blue-600">Analyze payment patterns and delays</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-0">Coming Soon</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-dashed border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-100/30">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg">
                        <Banknote className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-800">Profit Margins</h4>
                        <p className="text-sm text-purple-600">Track profitability by product and period</p>
                      </div>
                      <Badge className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-0">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Cards */}
                <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 rounded-lg p-6 border border-green-200/50 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800">Enhanced Analytics Coming Soon</h4>
                      <p className="text-sm text-green-700 mt-1">
                        We're working on powerful analytics features to help you gain deeper insights into your business performance.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
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