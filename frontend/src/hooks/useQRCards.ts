import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/ui/use-toast';
import {
  qrCardApi,
  type QRCardCreate,
  type QRCardUpdate,
  type QRCardFilters,
  type QRInvoiceCard,
  type QRCardAnalytics
} from '../services/qrCardApi';

// Query keys
export const qrCardKeys = {
  all: ['qr-cards'] as const,
  lists: () => [...qrCardKeys.all, 'list'] as const,
  list: (filters: QRCardFilters) => [...qrCardKeys.lists(), filters] as const,
  details: () => [...qrCardKeys.all, 'detail'] as const,
  detail: (id: string) => [...qrCardKeys.details(), id] as const,
  invoice: (invoiceId: string) => [...qrCardKeys.all, 'invoice', invoiceId] as const,
  analytics: (cardId: string) => [...qrCardKeys.all, 'analytics', cardId] as const,
  themes: () => [...qrCardKeys.all, 'themes'] as const,
  qrImage: (cardId: string, size: number) => [...qrCardKeys.all, 'qr-image', cardId, size] as const,
};

// Get QR card for invoice
export const useInvoiceQRCard = (invoiceId: string) => {
  return useQuery({
    queryKey: qrCardKeys.invoice(invoiceId),
    queryFn: () => qrCardApi.getInvoiceQRCard(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get QR card by ID
export const useQRCard = (cardId: string) => {
  return useQuery({
    queryKey: qrCardKeys.detail(cardId),
    queryFn: () => qrCardApi.getQRCard(cardId),
    enabled: !!cardId,
    staleTime: 5 * 60 * 1000,
  });
};

// List QR cards
export const useQRCards = (
  filters: QRCardFilters = {},
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: [...qrCardKeys.list(filters), skip, limit],
    queryFn: () => qrCardApi.listQRCards(filters, skip, limit),
    staleTime: 5 * 60 * 1000,
  });
};

// Get card analytics
export const useQRCardAnalytics = (cardId: string) => {
  return useQuery({
    queryKey: qrCardKeys.analytics(cardId),
    queryFn: () => qrCardApi.getCardAnalytics(cardId),
    enabled: !!cardId,
    staleTime: 2 * 60 * 1000, // 2 minutes for analytics
  });
};

// Get available themes
export const useQRCardThemes = () => {
  return useQuery({
    queryKey: qrCardKeys.themes(),
    queryFn: qrCardApi.getThemes,
    staleTime: 30 * 60 * 1000, // 30 minutes - themes don't change often
  });
};

// Get QR code image
export const useQRCodeImage = (cardId: string, size: number = 200) => {
  return useQuery({
    queryKey: qrCardKeys.qrImage(cardId, size),
    queryFn: () => qrCardApi.getQRCodeImage(cardId, size),
    enabled: !!cardId,
    staleTime: 60 * 60 * 1000, // 1 hour - QR codes don't change often
  });
};

// Create QR card
export const useCreateQRCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, cardData }: { invoiceId: string; cardData: QRCardCreate }) =>
      qrCardApi.createQRCard(invoiceId, cardData),
    onSuccess: (data: QRInvoiceCard) => {
      // Update invoice QR card cache
      queryClient.setQueryData(qrCardKeys.invoice(data.invoice_id), data);
      
      // Invalidate QR card lists
      queryClient.invalidateQueries({ queryKey: qrCardKeys.lists() });
      
      // Invalidate invoice data (QR info updated)
      queryClient.invalidateQueries({ queryKey: ['invoices', 'detail', data.invoice_id] });

      toast({
        title: 'QR Card Created',
        description: `Beautiful ${data.theme} card created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Card Creation Failed',
        description: error.response?.data?.detail || 'Failed to create QR card',
        variant: 'destructive',
      });
    },
  });
};

// Update QR card
export const useUpdateQRCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, updates }: { cardId: string; updates: QRCardUpdate }) =>
      qrCardApi.updateQRCard(cardId, updates),
    onSuccess: (data: QRInvoiceCard) => {
      // Update specific card cache
      queryClient.setQueryData(qrCardKeys.detail(data.id), data);
      
      // Update invoice QR card cache
      queryClient.setQueryData(qrCardKeys.invoice(data.invoice_id), data);
      
      // Invalidate QR card lists
      queryClient.invalidateQueries({ queryKey: qrCardKeys.lists() });

      toast({
        title: 'QR Card Updated',
        description: 'Card configuration updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.detail || 'Failed to update QR card',
        variant: 'destructive',
      });
    },
  });
};

// Delete QR card
export const useDeleteQRCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: qrCardApi.deleteQRCard,
    onSuccess: (_, cardId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: qrCardKeys.detail(cardId) });
      
      // Invalidate QR card lists
      queryClient.invalidateQueries({ queryKey: qrCardKeys.lists() });
      
      // Invalidate invoice QR card queries
      queryClient.invalidateQueries({ queryKey: qrCardKeys.all });

      toast({
        title: 'QR Card Deleted',
        description: 'Card deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion Failed',
        description: error.response?.data?.detail || 'Failed to delete QR card',
        variant: 'destructive',
      });
    },
  });
};

// Regenerate QR card
export const useRegenerateQRCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: qrCardApi.regenerateQRCard,
    onSuccess: (data: QRInvoiceCard) => {
      // Update specific card cache
      queryClient.setQueryData(qrCardKeys.detail(data.id), data);
      
      // Update invoice QR card cache
      queryClient.setQueryData(qrCardKeys.invoice(data.invoice_id), data);
      
      // Invalidate QR card lists
      queryClient.invalidateQueries({ queryKey: qrCardKeys.lists() });
      
      // Invalidate QR code images (new QR code generated)
      queryClient.invalidateQueries({ queryKey: [...qrCardKeys.all, 'qr-image'] });

      toast({
        title: 'QR Card Regenerated',
        description: 'New QR code and URL generated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Regeneration Failed',
        description: error.response?.data?.detail || 'Failed to regenerate QR card',
        variant: 'destructive',
      });
    },
  });
};

// Access public card (for testing)
export const useAccessPublicCard = () => {
  return useMutation({
    mutationFn: ({ cardId, password }: { cardId: string; password?: string }) =>
      qrCardApi.accessPublicCard(cardId, password),
    onError: (error: any) => {
      toast({
        title: 'Access Failed',
        description: error.response?.data?.detail || 'Failed to access card',
        variant: 'destructive',
      });
    },
  });
};