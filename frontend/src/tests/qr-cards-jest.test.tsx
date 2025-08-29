import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QRCardDisplay } from '../components/qr-cards/QRCardDisplay';
import { QRCardIntegration } from '../components/qr-cards/QRCardIntegration';
import type { QRInvoiceCard, QRCardData } from '../services/qrCardApi';

// Mock the hooks
jest.mock('../hooks/useQRCards', () => ({
  useInvoiceQRCard: jest.fn(),
  useQRCard: jest.fn(),
  useQRCards: jest.fn(),
  useQRCardAnalytics: jest.fn(),
  useQRCardThemes: jest.fn(),
  useQRCodeImage: jest.fn(),
  useCreateQRCard: jest.fn(),
  useUpdateQRCard: jest.fn(),
  useDeleteQRCard: jest.fn(),
  useRegenerateQRCard: jest.fn(),
  useAccessPublicCard: jest.fn(),
}));

// Mock the toast
jest.mock('../components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockQRCard: QRInvoiceCard = {
  id: 'card-123',
  invoice_id: 'invoice-123',
  qr_code: 'QR123456',
  card_url: '/invoice-card/card-123',
  short_url: 'abc123',
  theme: 'glass',
  background_color: '#ffffff',
  text_color: '#000000',
  accent_color: '#3B82F6',
  card_data: {
    invoice_number: 'INV-2024-001',
    invoice_type: 'gold',
    customer_info: {
      name: 'John Doe',
      phone: '+1 (555) 123-4567',
      email: 'john@example.com',
      address: '123 Main St, City, State'
    },
    amounts: {
      subtotal: 1000.00,
      tax_amount: 90.00,
      discount_amount: 0.00,
      total_amount: 1234.56,
      paid_amount: 1234.56,
      remaining_amount: 0.00,
      currency: 'USD'
    },
    status: {
      invoice_status: 'paid',
      workflow_stage: 'completed',
      payment_status: 'paid'
    },
    dates: {
      created_at: '2024-01-15T10:00:00Z',
      approved_at: '2024-01-15T10:30:00Z',
      payment_date: '2024-01-15T11:00:00Z'
    },
    items: [
      {
        name: 'Gold Ring',
        sku: 'GR-001',
        description: '18K Gold Ring',
        quantity: 1,
        unit_price: 1234.56,
        total_price: 1234.56,
        unit_of_measure: 'piece',
        weight_grams: 5.5,
        images: [],
        custom_attributes: {},
        gold_specific: {}
      }
    ],
    gold_fields: {
      gold_price_per_gram: 65.00,
      labor_cost_percentage: 10,
      profit_percentage: 15,
      vat_percentage: 9,
      gold_sood: 144.56,
      gold_ojrat: 100.00,
      gold_maliyat: 90.00,
      gold_total_weight: 5.5
    },
    metadata: {
      notes: 'Test invoice',
      payment_method: 'Cash',
      invoice_metadata: {}
    }
  } as QRCardData,
  is_public: true,
  requires_password: false,
  expires_at: undefined,
  view_count: 15,
  last_viewed_at: '2024-01-16T09:00:00Z',
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('QR Card Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('QRCardDisplay', () => {
    beforeEach(() => {
      const { useQRCodeImage } = require('../hooks/useQRCards');
      useQRCodeImage.mockReturnValue({
        data: new Blob(['mock-image'], { type: 'image/png' }),
        isLoading: false
      });
    });

    it('renders QR card information correctly', () => {
      renderWithQueryClient(<QRCardDisplay card={mockQRCard} />);
      
      expect(screen.getByText('QR Invoice Card')).toBeInTheDocument();
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays gold-specific fields for gold invoices', () => {
      renderWithQueryClient(<QRCardDisplay card={mockQRCard} />);
      
      expect(screen.getByText('سود (Profit)')).toBeInTheDocument();
      expect(screen.getByText('اجرت (Labor)')).toBeInTheDocument();
      expect(screen.getByText('مالیات (Tax)')).toBeInTheDocument();
      expect(screen.getByText('$144.56')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$90.00')).toBeInTheDocument();
    });

    it('shows analytics when enabled', () => {
      renderWithQueryClient(<QRCardDisplay card={mockQRCard} showAnalytics={true} />);
      
      expect(screen.getByText('Total Views')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('handles preview button click', () => {
      const onPreview = jest.fn();
      renderWithQueryClient(<QRCardDisplay card={mockQRCard} onPreview={onPreview} />);
      
      const previewButton = screen.getByRole('button', { name: /preview/i });
      fireEvent.click(previewButton);
      
      expect(onPreview).toHaveBeenCalled();
    });

    it('handles copy URL functionality', async () => {
      renderWithQueryClient(<QRCardDisplay card={mockQRCard} />);
      
      const copyButton = screen.getByRole('button', { name: /copy url/i });
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('/public/invoice-card/card-123')
        );
      });
    });
  });

  describe('QRCardIntegration', () => {
    it('shows preview mode before invoice creation', () => {
      renderWithQueryClient(<QRCardIntegration showPreview={true} />);
      
      expect(screen.getByText('QR Code & Card')).toBeInTheDocument();
      expect(screen.getByText('A beautiful invoice card with QR code will be generated')).toBeInTheDocument();
      expect(screen.getByText('Glass Theme')).toBeInTheDocument();
      expect(screen.getByText('Public Access')).toBeInTheDocument();
    });

    it('shows loading state while fetching QR card', () => {
      const { useInvoiceQRCard } = require('../hooks/useQRCards');
      useInvoiceQRCard.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      renderWithQueryClient(<QRCardIntegration invoiceId="invoice-123" />);
      
      expect(screen.getByText('Loading QR card...')).toBeInTheDocument();
    });

    it('shows create card option when no card exists', () => {
      const mockCreateQRCard = jest.fn();
      const { useInvoiceQRCard, useCreateQRCard } = require('../hooks/useQRCards');
      
      useInvoiceQRCard.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });
      
      useCreateQRCard.mockReturnValue({
        mutate: mockCreateQRCard,
        isPending: false
      });

      renderWithQueryClient(<QRCardIntegration invoiceId="invoice-123" />);
      
      expect(screen.getByText('No QR card found for this invoice')).toBeInTheDocument();
      
      const createButton = screen.getByRole('button', { name: /create qr card/i });
      fireEvent.click(createButton);
      
      expect(mockCreateQRCard).toHaveBeenCalledWith({
        invoiceId: 'invoice-123',
        cardData: {
          theme: 'glass',
          is_public: true,
          requires_password: false
        }
      });
    });

    it('displays full QR card interface when card exists', () => {
      const { useInvoiceQRCard } = require('../hooks/useQRCards');
      useInvoiceQRCard.mockReturnValue({
        data: mockQRCard,
        isLoading: false,
        error: null
      });

      renderWithQueryClient(<QRCardIntegration invoiceId="invoice-123" />);
      
      expect(screen.getByText('QR Invoice Card')).toBeInTheDocument();
      expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
      
      // Should show action buttons
      expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /qr code/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /customize/i })).toBeInTheDocument();
    });

    it('handles QR card actions correctly', () => {
      const mockOpen = jest.fn();
      const mockShare = jest.fn();
      global.window.open = mockOpen;
      Object.assign(navigator, { share: mockShare });

      const { useInvoiceQRCard } = require('../hooks/useQRCards');
      useInvoiceQRCard.mockReturnValue({
        data: mockQRCard,
        isLoading: false,
        error: null
      });

      renderWithQueryClient(<QRCardIntegration invoiceId="invoice-123" />);
      
      // Test preview
      const previewButton = screen.getByRole('button', { name: /preview/i });
      fireEvent.click(previewButton);
      expect(mockOpen).toHaveBeenCalledWith('/public/invoice-card/card-123', '_blank');
      
      // Test share
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Invoice INV-2024-001',
        text: 'View invoice details for John Doe',
        url: expect.stringContaining('/public/invoice-card/card-123')
      });
    });
  });

  describe('QR Card Integration Workflow', () => {
    it('completes QR card creation workflow', async () => {
      const mockCreateQRCard = jest.fn().mockResolvedValue(mockQRCard);
      
      const { useCreateQRCard, useInvoiceQRCard } = require('../hooks/useQRCards');
      
      useCreateQRCard.mockReturnValue({
        mutate: mockCreateQRCard,
        isPending: false
      });
      
      // Start with no QR card
      useInvoiceQRCard.mockReturnValueOnce({
        data: null,
        isLoading: false,
        error: null
      });

      renderWithQueryClient(<QRCardIntegration invoiceId="invoice-123" />);
      
      // Should show create card option
      expect(screen.getByText('No QR card found for this invoice')).toBeInTheDocument();
      
      // Create QR card
      const createButton = screen.getByRole('button', { name: /create qr card/i });
      fireEvent.click(createButton);
      
      expect(mockCreateQRCard).toHaveBeenCalledWith({
        invoiceId: 'invoice-123',
        cardData: {
          theme: 'glass',
          is_public: true,
          requires_password: false
        }
      });
    });
  });
});