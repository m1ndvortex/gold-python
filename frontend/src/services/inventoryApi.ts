import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';
import type { InventoryItem, Category } from '../types';

export interface InventoryFilters {
  search?: string;
  category_id?: string;
  low_stock?: boolean;
  page?: number;
  limit?: number;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateInventoryItemData {
  name: string;
  category_id: string;
  weight_grams: number;
  purchase_price: number;
  sell_price: number;
  stock_quantity: number;
  min_stock_level: number;
  description?: string;
  image_url?: string;
}

export interface UpdateInventoryItemData extends Partial<CreateInventoryItemData> {
  id: string;
}

export interface CreateCategoryData {
  name: string;
  parent_id?: string;
  description?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

export interface BulkUpdateData {
  item_ids: string[];
  updates: {
    category_id?: string;
    min_stock_level?: number;
    is_active?: boolean;
  };
}

// Inventory Items API
export const inventoryApi = {
  // Get inventory items with filters and pagination
  getItems: async (filters: InventoryFilters = {}): Promise<InventoryListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.low_stock) params.append('low_stock_only', 'true');
    if (filters.page) {
      const skip = (filters.page - 1) * (filters.limit || 20);
      params.append('skip', skip.toString());
    }
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/inventory/items?${queryString}` : '/inventory/items';
    
    // Backend returns an array directly, so we need to wrap it in the expected format
    const items = await apiGet<InventoryItem[]>(url);
    return {
      items: items || [],
      total: items?.length || 0,
      page: filters.page || 1,
      limit: filters.limit || 20,
      total_pages: 1 // Since we don't have real pagination info from backend
    };
  },

  // Get single inventory item
  getItem: async (id: string): Promise<InventoryItem> => {
    return apiGet<InventoryItem>(`/inventory/items/${id}`);
  },

  // Create new inventory item
  createItem: async (data: CreateInventoryItemData): Promise<InventoryItem> => {
    return apiPost<InventoryItem, CreateInventoryItemData>('/inventory/items', data);
  },

  // Update inventory item
  updateItem: async (id: string, data: Partial<CreateInventoryItemData>): Promise<InventoryItem> => {
    return apiPut<InventoryItem, Partial<CreateInventoryItemData>>(`/inventory/items/${id}`, data);
  },

  // Delete inventory item
  deleteItem: async (id: string): Promise<void> => {
    return apiDelete<void>(`/inventory/items/${id}`);
  },

  // Bulk update inventory items
  bulkUpdate: async (data: BulkUpdateData): Promise<{ updated_count: number }> => {
    return apiPost<{ updated_count: number }, BulkUpdateData>('/inventory/items/bulk-update', data);
  },

  // Upload image for inventory item
  uploadImage: async (file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/inventory/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.data;
  },
};

// Categories API
export const categoriesApi = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    return apiGet<Category[]>('/inventory/categories');
  },

  // Get single category
  getCategory: async (id: string): Promise<Category> => {
    return apiGet<Category>(`/inventory/categories/${id}`);
  },

  // Create new category
  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    return apiPost<Category, CreateCategoryData>('/inventory/categories', data);
  },

  // Update category
  updateCategory: async (id: string, data: Partial<CreateCategoryData>): Promise<Category> => {
    return apiPut<Category, Partial<CreateCategoryData>>(`/inventory/categories/${id}`, data);
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    return apiDelete<void>(`/inventory/categories/${id}`);
  },
};