import { api } from '../utils/api';

// QR Card Types
export interface QRInvoiceCard {
  id: string;
  invoice_id: string;
  qr_code: string;
  card_url: string;
  short_url: string;
  theme: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  card_data: QRCardData;
  is_public: boolean;
  requires_password: boolean;
  expires_at?: string;
  view_count: number;
  last_viewed_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QRCardData {
  invoice_number: string;
  invoice_type: 'gold' | 'general';
  customer_info: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  amounts: {
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    currency: string;
  };
  status: {
    invoice_status: string;
    workflow_stage: string;
    payment_status: string;
  };
  dates: {
    created_at: string;
    approved_at?: string;
    payment_date?: string;
  };
  items: QRCardItem[];
  gold_fields: {
    gold_price_per_gram?: number;
    labor_cost_percentage?: number;
    profit_percentage?: number;
    vat_percentage?: number;
    gold_sood?: number;
    gold_ojrat?: number;
    gold_maliyat?: number;
    gold_total_weight?: number;
  };
  metadata: {
    notes?: string;
    payment_method?: string;
    invoice_metadata?: Record<string, any>;
  };
}

export interface QRCardItem {
  name: string;
  sku: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_of_measure: string;
  weight_grams?: number;
  images: any[];
  custom_attributes: Record<string, any>;
  gold_specific: Record<string, any>;
}

export interface QRCardCreate {
  theme?: string;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  is_public?: boolean;
  requires_password?: boolean;
  access_password?: string;
  expires_at?: string;
}

export interface QRCardUpdate {
  theme?: string;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  is_public?: boolean;
  requires_password?: boolean;
  access_password?: string;
  expires_at?: string;
  is_active?: boolean;
}

export interface QRCardAnalytics {
  card_id: string;
  total_views: number;
  unique_visitors: number;
  recent_views_7d: number;
  first_viewed?: string;
  last_viewed?: string;
  device_breakdown: Record<string, number>;
  browser_breakdown: Record<string, number>;
  os_breakdown: Record<string, number>;
  is_active: boolean;
  expires_at?: string;
  theme: string;
}

export interface QRCardTheme {
  name: string;
  display_name: string;
  description: string;
  preview_colors: {
    background: string;
    text: string;
    accent: string;
  };
}

export interface QRCardsResponse {
  items: QRInvoiceCard[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface QRCardFilters {
  invoice_type?: 'gold' | 'general';
  theme?: string;
  is_active?: boolean;
  is_public?: boolean;
  created_after?: string;
  created_before?: string;
  sort_by?: 'created_at' | 'view_count' | 'last_viewed_at';
  sort_order?: 'asc' | 'desc';
}

// QR Card API functions
export const qrCardApi = {
  // Get QR card for invoice
  getInvoiceQRCard: async (invoiceId: string): Promise<QRInvoiceCard> => {
    const response = await api.get(`/universal-invoices/${invoiceId}/qr-card`);
    return response.data as QRInvoiceCard;
  },

  // Create QR card for invoice
  createQRCard: async (invoiceId: string, cardData: QRCardCreate): Promise<QRInvoiceCard> => {
    const response = await api.post(`/qr-cards/?invoice_id=${invoiceId}`, cardData);
    return response.data as QRInvoiceCard;
  },

  // Get QR card by ID
  getQRCard: async (cardId: string): Promise<QRInvoiceCard> => {
    const response = await api.get(`/qr-cards/${cardId}`);
    return response.data as QRInvoiceCard;
  },

  // Update QR card
  updateQRCard: async (cardId: string, updates: QRCardUpdate): Promise<QRInvoiceCard> => {
    const response = await api.put(`/qr-cards/${cardId}`, updates);
    return response.data as QRInvoiceCard;
  },

  // Delete QR card
  deleteQRCard: async (cardId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/qr-cards/${cardId}`);
    return response.data as { message: string };
  },

  // Regenerate QR card
  regenerateQRCard: async (cardId: string): Promise<QRInvoiceCard> => {
    const response = await api.post(`/qr-cards/${cardId}/regenerate`);
    return response.data as QRInvoiceCard;
  },

  // Get QR code image
  getQRCodeImage: async (cardId: string, size: number = 200): Promise<Blob> => {
    const response = await api.get(`/qr-cards/${cardId}/qr-image?size=${size}`, {
      responseType: 'blob'
    });
    return response.data as Blob;
  },

  // Get card analytics
  getCardAnalytics: async (cardId: string): Promise<QRCardAnalytics> => {
    const response = await api.get(`/qr-cards/${cardId}/analytics`);
    return response.data as QRCardAnalytics;
  },

  // List QR cards
  listQRCards: async (
    filters: QRCardFilters = {},
    skip: number = 0,
    limit: number = 100
  ): Promise<QRCardsResponse> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });
    
    const response = await api.get(`/qr-cards/?${params}`);
    return response.data as QRCardsResponse;
  },

  // Get available themes
  getThemes: async (): Promise<QRCardTheme[]> => {
    const response = await api.get('/qr-cards/themes');
    return response.data as QRCardTheme[];
  },

  // Access public card (for testing)
  accessPublicCard: async (cardId: string, password?: string): Promise<string> => {
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    const response = await api.get(`/public/invoice-card/${cardId}${params}`, {
      responseType: 'text'
    });
    return response.data as string;
  },

  // Access card via short URL
  accessShortUrl: async (shortUrl: string, password?: string): Promise<string> => {
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    const response = await api.get(`/public/card/${shortUrl}${params}`, {
      responseType: 'text'
    });
    return response.data as string;
  }
};