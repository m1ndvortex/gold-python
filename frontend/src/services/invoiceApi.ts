import { api } from '../utils/api';
import type {
  Invoice,
  InvoiceItem,
  Customer,
  InventoryItem,
  Payment
} from '../types';

// Extended types for universal dual invoice functionality
export interface UniversalInvoiceItemCreate {
  inventory_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  weight_grams?: number;
  unit_of_measure?: string;
  item_description?: string;
  custom_attributes?: Record<string, any>;
  item_images?: any[];
  gold_specific?: Record<string, any>;
}

export interface GoldInvoiceFields {
  gold_price_per_gram: number;
  labor_cost_percentage: number;
  profit_percentage: number;
  vat_percentage: number;
  gold_sood?: number;
  gold_ojrat?: number;
  gold_maliyat?: number;
  gold_total_weight?: number;
}

export interface UniversalInvoiceCreate {
  type: 'gold' | 'general';
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_email?: string;
  items: UniversalInvoiceItemCreate[];
  gold_fields?: GoldInvoiceFields;
  requires_approval?: boolean;
  notes?: string;
  invoice_metadata?: Record<string, any>;
  card_theme?: string;
  card_config?: Record<string, any>;
}

// Legacy interface for backward compatibility
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
  weight_grams?: number;
  base_price?: number;
  labor_cost?: number;
  profit_amount?: number;
  vat_amount?: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceCalculationSummary {
  items: InvoiceCalculation[];
  subtotal: number;
  total_labor_cost: number;
  total_profit: number;
  total_vat: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
}

export interface InvoiceWithDetails extends Invoice {
  customer?: Customer;
  invoice_items: (InvoiceItem & { inventory_item?: InventoryItem })[];
  payments: Payment[];
}

export interface InvoiceSearchFilters {
  search?: string;
  type?: 'gold' | 'general';
  status?: string;
  workflow_stage?: string;
  payment_status?: string;
  customer_id?: string;
  invoice_number?: string;
  created_after?: string;
  created_before?: string;
  min_amount?: number;
  max_amount?: number;
  has_remaining_amount?: boolean;
  approved_by?: string;
  sort_by?: 'created_at' | 'total_amount' | 'invoice_number';
  sort_order?: 'asc' | 'desc';
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
  total_amount: string | number; // Decimal from backend comes as string
  total_paid: string | number; // Decimal from backend comes as string
  total_outstanding: string | number; // Decimal from backend comes as string
  gold_invoices_count: number;
  general_invoices_count: number;
  average_invoice_amount: string | number; // Decimal from backend comes as string
  status_breakdown: Record<string, number>;
  payment_status_breakdown: Record<string, number>;
  monthly_trends: Array<Record<string, any>>;
}

// Universal Invoice API functions
export const invoiceApi = {
  // Calculate universal invoice preview without creating
  calculateInvoice: async (invoiceData: UniversalInvoiceCreate): Promise<InvoiceCalculationSummary> => {
    const response = await api.post('/universal-invoices/calculate', invoiceData);
    return response.data as InvoiceCalculationSummary;
  },

  // Create new universal invoice
  createInvoice: async (invoiceData: UniversalInvoiceCreate): Promise<InvoiceWithDetails> => {
    const response = await api.post('/universal-invoices/', invoiceData);
    return response.data as InvoiceWithDetails;
  },

  // Legacy calculate invoice (for backward compatibility)
  calculateLegacyInvoice: async (invoiceData: InvoiceCreate): Promise<InvoiceCalculationSummary> => {
    const response = await api.post('/invoices/calculate', invoiceData);
    return response.data as InvoiceCalculationSummary;
  },

  // Legacy create invoice (for backward compatibility)
  createLegacyInvoice: async (invoiceData: InvoiceCreate): Promise<InvoiceWithDetails> => {
    const response = await api.post('/invoices/', invoiceData);
    return response.data as InvoiceWithDetails;
  },

  // Get universal invoice by ID
  getInvoice: async (invoiceId: string): Promise<InvoiceWithDetails> => {
    const response = await api.get(`/universal-invoices/${invoiceId}`);
    return response.data as InvoiceWithDetails;
  },

  // List universal invoices with filters
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
    
    const response = await api.get(`/universal-invoices/?${params}`);
    return (response.data as any)?.items || response.data;
  },

  // Update universal invoice
  updateInvoice: async (
    invoiceId: string,
    updateData: Partial<UniversalInvoiceCreate>
  ): Promise<InvoiceWithDetails> => {
    const response = await api.put(`/universal-invoices/${invoiceId}`, updateData);
    return response.data as InvoiceWithDetails;
  },

  // Approve invoice
  approveInvoice: async (
    invoiceId: string,
    approvalNotes?: string
  ): Promise<InvoiceWithDetails> => {
    const response = await api.put(`/universal-invoices/${invoiceId}/approve`, {
      approval_notes: approvalNotes
    });
    return response.data as InvoiceWithDetails;
  },

  // Add payment to universal invoice
  addPayment: async (
    invoiceId: string,
    paymentData: InvoicePaymentRequest
  ): Promise<Payment> => {
    const response = await api.post(`/universal-invoices/${invoiceId}/payments`, paymentData);
    return response.data as Payment;
  },

  // Update universal invoice status
  updateStatus: async (
    invoiceId: string,
    statusUpdate: InvoiceStatusUpdate
  ): Promise<Invoice> => {
    const response = await api.put(`/universal-invoices/${invoiceId}/status`, statusUpdate);
    return response.data as Invoice;
  },

  // Delete universal invoice
  deleteInvoice: async (invoiceId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/universal-invoices/${invoiceId}`);
    return response.data as { message: string };
  },

  // Override item price
  overrideItemPrice: async (
    invoiceId: string,
    itemId: string,
    overridePrice: number,
    reason?: string
  ): Promise<any> => {
    const response = await api.put(`/universal-invoices/${invoiceId}/items/${itemId}/price-override`, {
      override_price: overridePrice,
      reason: reason
    });
    return response.data;
  },

  // Generate PDF
  generatePDF: async (invoiceId: string): Promise<any> => {
    const response = await api.get(`/universal-invoices/${invoiceId}/pdf`);
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
    
    const response = await api.get(`/universal-invoices/analytics/summary?${params}`);
    return response.data as InvoiceSummary;
  },

  // Legacy API functions for backward compatibility
  legacy: {
    // Get legacy invoice by ID
    getInvoice: async (invoiceId: string): Promise<InvoiceWithDetails> => {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data as InvoiceWithDetails;
    },

    // List legacy invoices
    listInvoices: async (
      filters: Partial<InvoiceSearchFilters> = {},
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

    // Add payment to legacy invoice
    addPayment: async (
      invoiceId: string,
      paymentData: InvoicePaymentRequest
    ): Promise<Payment> => {
      const response = await api.post(`/invoices/${invoiceId}/payments`, paymentData);
      return response.data as Payment;
    },

    // Update legacy invoice status
    updateStatus: async (
      invoiceId: string,
      statusUpdate: InvoiceStatusUpdate
    ): Promise<Invoice> => {
      const response = await api.put(`/invoices/${invoiceId}/status`, statusUpdate);
      return response.data as Invoice;
    },

    // Delete legacy invoice
    deleteInvoice: async (invoiceId: string): Promise<{ message: string }> => {
      const response = await api.delete(`/invoices/${invoiceId}`);
      return response.data as { message: string };
    },

    // Get legacy invoice summary
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
  }
};