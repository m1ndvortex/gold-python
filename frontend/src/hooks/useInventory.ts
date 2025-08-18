import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, categoriesApi } from '../services/inventoryApi';
import type { 
  InventoryFilters, 
  CreateInventoryItemData,
  CreateCategoryData,
  BulkUpdateData
} from '../services/inventoryApi';

// Query keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  items: () => [...inventoryKeys.all, 'items'] as const,
  item: (id: string) => [...inventoryKeys.items(), id] as const,
  itemsWithFilters: (filters: InventoryFilters) => [...inventoryKeys.items(), filters] as const,
  categories: () => [...inventoryKeys.all, 'categories'] as const,
  category: (id: string) => [...inventoryKeys.categories(), id] as const,
};

// Inventory Items Hooks
export const useInventoryItems = (filters: InventoryFilters = {}) => {
  return useQuery({
    queryKey: inventoryKeys.itemsWithFilters(filters),
    queryFn: () => inventoryApi.getItems(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInventoryItem = (id: string) => {
  return useQuery({
    queryKey: inventoryKeys.item(id),
    queryFn: () => inventoryApi.getItem(id),
    enabled: !!id,
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryItemData) => inventoryApi.createItem(data),
    onSuccess: () => {
      // Invalidate and refetch inventory items
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInventoryItemData> }) => 
      inventoryApi.updateItem(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific item and items list
      queryClient.invalidateQueries({ queryKey: inventoryKeys.item(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteItem(id),
    onSuccess: () => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
    },
  });
};

export const useBulkUpdateInventoryItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateData) => inventoryApi.bulkUpdate(data),
    onSuccess: () => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
    },
  });
};

export const useUploadInventoryImage = () => {
  return useMutation({
    mutationFn: (file: File) => inventoryApi.uploadImage(file),
  });
};

// Categories Hooks
export const useCategories = () => {
  return useQuery({
    queryKey: inventoryKeys.categories(),
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: inventoryKeys.category(id),
    queryFn: () => categoriesApi.getCategory(id),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => categoriesApi.createCategory(data),
    onSuccess: () => {
      // Invalidate categories
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryData> }) => 
      categoriesApi.updateCategory(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific category and categories list
      queryClient.invalidateQueries({ queryKey: inventoryKeys.category(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      // Invalidate categories
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
    },
  });
};