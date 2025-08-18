import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, FileText, BarChart3 } from 'lucide-react';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoicePreview } from '../components/invoices/InvoicePreview';
import { PaymentForm } from '../components/invoices/PaymentForm';
import { PDFGenerator } from '../components/invoices/PDFGenerator';
import { useInvoice, useInvoiceSummary } from '../hooks/useInvoices';
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-gray-600">Create, manage, and track invoices</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold">{summary.total_invoices}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold">${summary.total_amount.toFixed(2)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">${summary.total_paid.toFixed(2)}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">${summary.total_remaining.toFixed(2)}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Invoice List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <InvoiceList
            onCreateNew={handleCreateNew}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onAddPayment={handleAddPayment}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Invoice analytics and reports coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
            </DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Invoice Details
              {invoiceDetails && (
                <PDFGenerator
                  invoice={invoiceDetails}
                  onGenerated={(blob) => {
                    console.log('PDF generated:', blob);
                  }}
                />
              )}
            </DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <PaymentForm
              invoice={selectedInvoice}
              onSuccess={handlePaymentAdded}
              onCancel={closeDialogs}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};