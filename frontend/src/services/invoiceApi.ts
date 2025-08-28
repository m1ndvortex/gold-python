import { api } from '../utils/api';
import type {
  Invoice,
  InvoiceItem,
  Customer,
  InventoryItem,
  Payment
} from '../types';

// Extended types for invoice functionality
export interface InvoiceItemCreate {
  inventory_item_id: string;
  quantity: number;
  weight_grams: number;
}

export interface InvoiceCreate {
  customer_id: string;
  gold_price_per_gram: number;
  labor_cost_percentage: number;
  profit_percentage: number;
  vat_percentage: number;
  items: InvoiceItemCreate[];
}

export interface InvoiceCalculation {
  item_id: string;
  item_name: string;
  quantity: number;
  weight_grams: number;
  base_price: number;
  labor_cost: number;
  profit_amount: number;
  vat_amount: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceCalculationSummary {
  items: InvoiceCalculation[];
  subtotal: number;
  total_labor_cost: number;
  total_profit: number;
  total_vat: number;
  grand_total: number;
}

export interface InvoiceWithDetails extends Invoice {
  customer?: Customer;
  invoice_items: (InvoiceItem & { inventory_item?: InventoryItem })[];
  payments: Payment[];
}

export interface InvoiceSearchFilters {
  customer_id?: string;
  status?: string;
  invoice_number?: string;
  created_after?: string;
  created_before?: string;
  has_remaining_amount?: boolean;
}

export interface InvoicePaymentRequest {
  amount: number;
  payment_method: string;
  description?: string;
}

export interface InvoiceStatusUpdate {
  status: 'pending' | 'paid' | 'partially_paid' | 'cancelled';
}

export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_remaining: number;
  status_breakdown: Record<string, number>;
  average_invoice_amount: number;
}

// Invoice API functions
export const invoiceApi = {
  // Calculate invoice preview without creating
  calculateInvoice: async (invoiceData: InvoiceCreate): Promise<InvoiceCalculationSummary> => {
    const response = await api.post('/invoices/calculate', invoiceData);
    return response.data as InvoiceCalculationSummary;
  },

  // Create new invoice
  createInvoice: async (invoiceData: InvoiceCreate): Promise<InvoiceWithDetails> => {
    const response = await api.post('/invoices/', invoiceData);
    return response.data as InvoiceWithDetails;
  },

  // Get invoice by ID
  getInvoice: async (invoiceId: string): Promise<InvoiceWithDetails> => {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response.data as InvoiceWithDetails;
  },

  // List invoices with filters
  listInvoices: async (
    filters: InvoiceSearchFilters = {},
    skip: number = 0,
    limit: number = 100
  ): Promise<Invoice[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });
    
    const response = await api.get(`/invoices/?${params}`);
    return response.data as any;
  },

  // Update invoice
  updateInvoice: async (
    invoiceId: string,
    updateData: Partial<InvoiceCreate>
  ): Promise<InvoiceWithDetails> => {
    const response = await api.put(`/invoices/${invoiceId}`, updateData);
    return response.data as InvoiceWithDetails;
  },

  // Add payment to invoice
  addPayment: async (
    invoiceId: string,
    paymentData: InvoicePaymentRequest
  ): Promise<Payment> => {
    const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
    return response.data as Payment;
  },

  // Update invoice status
  updateStatus: async (
    invoiceId: string,
    statusUpdate: InvoiceStatusUpdate
  ): Promise<Invoice> => {
    const response = await api.put(`/invoices/${invoiceId}/status`, statusUpdate);
    return response.data as Invoice;
  },

  // Delete invoice
  deleteInvoice: async (invoiceId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/invoices/${invoiceId}`);
    return response.data as { message: string };
  },

  // Generate PDF
  generatePDF: async (invoiceId: string): Promise<any> => {
    const response = await api.get(`/invoices/${invoiceId}/pdf`);
    return response.data as any;
  },

  // Get invoice summary statistics
  getSummary: async (
    startDate?: string,
    endDate?: string
  ): Promise<InvoiceSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/invoices/reports/summary?${params}`);
    return response.data as InvoiceSummary;
  }
};