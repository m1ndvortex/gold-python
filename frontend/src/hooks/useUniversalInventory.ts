/**
 * Universal Inventory Management Hooks
 * React Query hooks for the universal inventory system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  universalInventoryApi,
  universalCategoriesApi,
  stockAlertsApi,
  inventoryAnalyticsApi
} from '../services/inventoryApi';
import type {
  UniversalInventorySearchFilters,
  UniversalCategorySearchFilters,
  UniversalInventoryItemCreate,
  UniversalInventoryItemUpdate,
  UniversalCategoryCreate,
  UniversalCategoryUpdate,
  StockUpdateRequest,
  StockAdjustmentRequest,
  BulkUpdateRequest,
  BulkDeleteRequest,
  BulkTagRequest
} from '../types/universalInventory';

// Query keys
export const universalInventoryKeys = {
  all: ['universal-inventory'] as const,
  items: () => [...universalInventoryKeys.all, 'items'] as const,
  item: (id: string) => [...universalInventoryKeys.items(), id] as const,
  itemsWithFilters: (filters: UniversalInventorySearchFilters, page: number, per_page: number) => 
    [...universalInventoryKeys.items(), 'filtered', filters, page, per_page] as const,
  itemMovements: (id: string, limit: number) => [...universalInventoryKeys.item(id), 'movements', limit] as const,
  categories: () => [...universalInventoryKeys.all, 'categories'] as const,
  category: (id: string) => [...universalInventoryKeys.categories(), id] as const,
  categoriesWithFilters: (filters?: UniversalCategorySearchFilters) => 
    [...universalInventoryKeys.categories(), 'filtered', filters] as const,
  categoriesTree: (business_type?: string) => 
    [...universalInventoryKeys.categories(), 'tree', business_type] as const,
  alerts: () => [...universalInventoryKeys.all, 'alerts'] as const,
  lowStockAlerts: (threshold: number) => [...universalInventoryKeys.alerts(), 'low-stock', threshold] as const,
  outOfStockItems: () => [...universalInventoryKeys.alerts(), 'out-of-stock'] as const,
  analytics: () => [...universalInventoryKeys.all, 'analytics'] as const,
  summary: () => [...universalInventoryKeys.all, 'summary'] as const,
  searchSuggestions: (query: string, limit: number) => 
    [...universalInventoryKeys.all, 'search-suggestions', query, limit] as const,
  barcode: (id: string) => [...universalInventoryKeys.item(id), 'barcode'] as const,
  qrcode: (id: string) => [...universalInventoryKeys.item(id), 'qrcode'] as const,
};

// Universal Inventory Items Hooks
export const useUniversalInventoryItems = (
  filters: UniversalInventorySearchFilters = {},
  page = 1,
  per_page = 50
) => {
  return useQuery({
    queryKey: universalInventoryKeys.itemsWithFilters(filters, page, per_page),
    queryFn: () => universalInventoryApi.searchItems(filters, page, per_page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
};

export const useUniversalInventoryItem = (id: string) => {
  return useQuery({
    queryKey: universalInventoryKeys.item(id),
    queryFn: () => universalInventoryApi.getItem(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateUniversalInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UniversalInventoryItemCreate) => universalInventoryApi.createItem(data),
    onSuccess: () => {
      // Invalidate and refetch inventory items
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.analytics() });
    },
  });
};

export const useUpdateUniversalInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UniversalInventoryItemUpdate }) => 
      universalInventoryApi.updateItem(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific item and items list
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.item(id) });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
    },
  });
};

export const useUpdateUniversalItemStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stockUpdate }: { id: string; stockUpdate: StockUpdateRequest }) => 
      universalInventoryApi.updateStock(id, stockUpdate),
    onSuccess: (_, { id }) => {
      // Invalidate specific item, items list, and alerts
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.item(id) });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.itemMovements(id, 50) });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
    },
  });
};

export const useAdjustUniversalItemStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, adjustment }: { id: string; adjustment: StockAdjustmentRequest }) => 
      universalInventoryApi.adjustStock(id, adjustment),
    onSuccess: (_, { id }) => {
      // Invalidate specific item, items list, and alerts
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.item(id) });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.itemMovements(id, 50) });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
    },
  });
};

export const useDeleteUniversalInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force = false }: { id: string; force?: boolean }) => 
      universalInventoryApi.deleteItem(id, force),
    onSuccess: () => {
      // Invalidate items list and summary
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.analytics() });
    },
  });
};

export const useUniversalItemMovements = (id: string, limit = 50) => {
  return useQuery({
    queryKey: universalInventoryKeys.itemMovements(id, limit),
    queryFn: () => universalInventoryApi.getItemMovements(id, limit),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Bulk Operations Hooks
export const useBulkUpdateUniversalItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkUpdateRequest) => universalInventoryApi.bulkUpdate(request),
    onSuccess: () => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
    },
  });
};

export const useBulkTagUniversalItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkTagRequest) => universalInventoryApi.bulkTag(request),
    onSuccess: () => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
    },
  });
};

export const useBulkDeleteUniversalItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkDeleteRequest) => universalInventoryApi.bulkDelete(request),
    onSuccess: () => {
      // Invalidate items list and summary
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.items() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.analytics() });
    },
  });
};

// Universal Categories Hooks
export const useUniversalCategories = (filters?: UniversalCategorySearchFilters) => {
  return useQuery({
    queryKey: universalInventoryKeys.categoriesWithFilters(filters),
    queryFn: () => universalCategoriesApi.getCategories(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUniversalCategoriesTree = (business_type?: string) => {
  return useQuery({
    queryKey: universalInventoryKeys.categoriesTree(business_type),
    queryFn: () => universalCategoriesApi.getCategoriesTree(business_type),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUniversalCategory = (id: string) => {
  return useQuery({
    queryKey: universalInventoryKeys.category(id),
    queryFn: () => universalCategoriesApi.getCategory(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateUniversalCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UniversalCategoryCreate) => universalCategoriesApi.createCategory(data),
    onSuccess: () => {
      // Invalidate categories
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
    },
  });
};

export const useUpdateUniversalCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UniversalCategoryUpdate }) => 
      universalCategoriesApi.updateCategory(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific category and categories list
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.category(id) });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.categories() });
    },
  });
};

export const useDeleteUniversalCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force = false }: { id: string; force?: boolean }) => 
      universalCategoriesApi.deleteCategory(id, force),
    onSuccess: () => {
      // Invalidate categories
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: universalInventoryKeys.summary() });
    },
  });
};

// Stock Alerts Hooks
export const useLowStockAlerts = (threshold_multiplier = 1.0) => {
  return useQuery({
    queryKey: universalInventoryKeys.lowStockAlerts(threshold_multiplier),
    queryFn: () => stockAlertsApi.getLowStockAlerts(threshold_multiplier),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useOutOfStockItems = () => {
  return useQuery({
    queryKey: universalInventoryKeys.outOfStockItems(),
    queryFn: () => stockAlertsApi.getOutOfStockItems(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Analytics Hooks
export const useInventoryAnalytics = () => {
  return useQuery({
    queryKey: universalInventoryKeys.analytics(),
    queryFn: () => inventoryAnalyticsApi.getAnalytics(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useInventorySummary = () => {
  return useQuery({
    queryKey: universalInventoryKeys.summary(),
    queryFn: () => inventoryAnalyticsApi.getSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

// Search Suggestions Hook
export const useSearchSuggestions = (query: string, limit = 10) => {
  return useQuery({
    queryKey: universalInventoryKeys.searchSuggestions(query, limit),
    queryFn: () => universalInventoryApi.getSearchSuggestions(query, limit),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};

// Barcode and QR Code Hooks
export const useItemBarcode = (id: string) => {
  return useQuery({
    queryKey: universalInventoryKeys.barcode(id),
    queryFn: () => universalInventoryApi.getBarcode(id),
    enabled: false, // Only fetch when explicitly requested
    staleTime: Infinity, // Barcodes don't change
  });
};

export const useItemQRCode = (id: string) => {
  return useQuery({
    queryKey: universalInventoryKeys.qrcode(id),
    queryFn: () => universalInventoryApi.getQRCode(id),
    enabled: false, // Only fetch when explicitly requested
    staleTime: Infinity, // QR codes don't change
  });
};

// Custom hooks for common operations
export const useInventorySearch = () => {
  const queryClient = useQueryClient();

  const searchItems = async (filters: UniversalInventorySearchFilters, page = 1, per_page = 50) => {
    return queryClient.fetchQuery({
      queryKey: universalInventoryKeys.itemsWithFilters(filters, page, per_page),
      queryFn: () => universalInventoryApi.searchItems(filters, page, per_page),
      staleTime: 2 * 60 * 1000,
    });
  };

  return { searchItems };
};

export const useInventoryActions = () => {
  const createItem = useCreateUniversalInventoryItem();
  const updateItem = useUpdateUniversalInventoryItem();
  const deleteItem = useDeleteUniversalInventoryItem();
  const updateStock = useUpdateUniversalItemStock();
  const adjustStock = useAdjustUniversalItemStock();
  const bulkUpdate = useBulkUpdateUniversalItems();
  const bulkTag = useBulkTagUniversalItems();
  const bulkDelete = useBulkDeleteUniversalItems();

  return {
    createItem,
    updateItem,
    deleteItem,
    updateStock,
    adjustStock,
    bulkUpdate,
    bulkTag,
    bulkDelete,
  };
};

export const useCategoryActions = () => {
  const createCategory = useCreateUniversalCategory();
  const updateCategory = useUpdateUniversalCategory();
  const deleteCategory = useDeleteUniversalCategory();

  return {
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

// Real-time updates hook (placeholder for WebSocket integration)
export const useInventoryRealTimeUpdates = (enabled = false) => {
  // This would integrate with WebSocket for real-time updates
  // For now, it's a placeholder that could trigger query invalidations
  
  return {
    isConnected: false,
    lastUpdate: null,
    subscribe: () => {},
    unsubscribe: () => {},
  };
};