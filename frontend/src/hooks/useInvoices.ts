import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../components/ui/use-toast';
import {
  invoiceApi,
  type UniversalInvoiceCreate,
  type InvoiceCreate,
  type InvoiceSearchFilters,
  type InvoicePaymentRequest,
  type InvoiceStatusUpdate,
  type InvoiceWithDetails
} from '../services/invoiceApi';

// Query keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceSearchFilters) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  summary: () => [...invoiceKeys.all, 'summary'] as const,
  calculation: () => [...invoiceKeys.all, 'calculation'] as const,
};

// List invoices hook
export const useInvoices = (
  filters: InvoiceSearchFilters = {},
  skip: number = 0,
  limit: number = 100
) => {
  return useQuery({
    queryKey: [...invoiceKeys.list(filters), skip, limit],
    queryFn: () => invoiceApi.listInvoices(filters, skip, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single invoice hook
export const useInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceId),
    queryFn: () => invoiceApi.getInvoice(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000,
  });
};

// Invoice summary hook
export const useInvoiceSummary = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...invoiceKeys.summary(), startDate, endDate],
    queryFn: () => invoiceApi.getSummary(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
};

// Calculate invoice hook (for preview)
export const useCalculateInvoice = () => {
  return useMutation({
    mutationFn: invoiceApi.calculateInvoice,
    onError: (error: any) => {
      toast({
        title: 'Calculation Error',
        description: error.response?.data?.detail || 'Failed to calculate invoice',
        variant: 'destructive',
      });
    },
  });
};

// Create universal invoice hook
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoiceApi.createInvoice,
    onSuccess: (data: InvoiceWithDetails) => {
      // Invalidate and refetch invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Invalidate customer data (debt updates)
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // Invalidate inventory data (stock updates)
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      toast({
        title: 'Invoice Created',
        description: `${data.type === 'gold' ? 'Gold' : 'General'} invoice ${data.invoice_number} created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.response?.data?.detail || 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });
};

// Create legacy invoice hook (for backward compatibility)
export const useCreateLegacyInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoiceApi.createLegacyInvoice,
    onSuccess: (data: InvoiceWithDetails) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      toast({
        title: 'Invoice Created',
        description: `Invoice ${data.invoice_number} created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.response?.data?.detail || 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });
};

// Update universal invoice hook
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, updateData }: { invoiceId: string; updateData: Partial<UniversalInvoiceCreate> }) =>
      invoiceApi.updateInvoice(invoiceId, updateData),
    onSuccess: (data: InvoiceWithDetails) => {
      // Update the specific invoice in cache
      queryClient.setQueryData(invoiceKeys.detail(data.id), data);
      
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      toast({
        title: 'Invoice Updated',
        description: `${data.type === 'gold' ? 'Gold' : 'General'} invoice ${data.invoice_number} updated successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.detail || 'Failed to update invoice',
        variant: 'destructive',
      });
    },
  });
};

// Approve invoice hook
export const useApproveInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, approvalNotes }: { invoiceId: string; approvalNotes?: string }) =>
      invoiceApi.approveInvoice(invoiceId, approvalNotes),
    onSuccess: (data: InvoiceWithDetails) => {
      // Update the specific invoice in cache
      queryClient.setQueryData(invoiceKeys.detail(data.id), data);
      
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      
      // Invalidate inventory data (stock updates)
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      toast({
        title: 'Invoice Approved',
        description: `${data.type === 'gold' ? 'Gold' : 'General'} invoice ${data.invoice_number} approved and stock updated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Approval Failed',
        description: error.response?.data?.detail || 'Failed to approve invoice',
        variant: 'destructive',
      });
    },
  });
};

// Override item price hook
export const useOverrideItemPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, itemId, overridePrice, reason }: { 
      invoiceId: string; 
      itemId: string; 
      overridePrice: number; 
      reason?: string 
    }) => invoiceApi.overrideItemPrice(invoiceId, itemId, overridePrice, reason),
    onSuccess: (_, variables) => {
      // Invalidate the specific invoice
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      toast({
        title: 'Price Override Applied',
        description: 'Item price has been successfully overridden',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Price Override Failed',
        description: error.response?.data?.detail || 'Failed to override item price',
        variant: 'destructive',
      });
    },
  });
};

// Add payment hook
export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, paymentData }: { invoiceId: string; paymentData: InvoicePaymentRequest }) =>
      invoiceApi.addPayment(invoiceId, paymentData),
    onSuccess: (_, variables) => {
      // Invalidate the specific invoice
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      
      // Invalidate customer data (debt updates)
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast({
        title: 'Payment Added',
        description: 'Payment recorded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Payment Failed',
        description: error.response?.data?.detail || 'Failed to record payment',
        variant: 'destructive',
      });
    },
  });
};

// Update status hook
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, statusUpdate }: { invoiceId: string; statusUpdate: InvoiceStatusUpdate }) =>
      invoiceApi.updateStatus(invoiceId, statusUpdate),
    onSuccess: (data, variables) => {
      // Update the specific invoice in cache
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      toast({
        title: 'Status Updated',
        description: `Invoice status updated to ${data.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Status Update Failed',
        description: error.response?.data?.detail || 'Failed to update status',
        variant: 'destructive',
      });
    },
  });
};

// Delete invoice hook
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invoiceApi.deleteInvoice,
    onSuccess: () => {
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Invalidate customer data (debt updates)
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // Invalidate inventory data (stock restoration)
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      toast({
        title: 'Invoice Deleted',
        description: 'Invoice deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Deletion Failed',
        description: error.response?.data?.detail || 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });
};

// Generate PDF hook
export const useGeneratePDF = () => {
  return useMutation({
    mutationFn: invoiceApi.generatePDF,
    onError: (error: any) => {
      toast({
        title: 'PDF Generation Failed',
        description: error.response?.data?.detail || 'Failed to generate PDF',
        variant: 'destructive',
      });
    },
  });
};