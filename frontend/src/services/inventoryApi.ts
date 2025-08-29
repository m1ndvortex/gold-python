import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../utils/api';
import type { InventoryItem, Category } from '../types';
import type {
  UniversalInventoryItem,
  UniversalInventoryItemWithCategory,
  UniversalInventoryItemCreate,
  UniversalInventoryItemUpdate,
  UniversalCategory,
  UniversalCategoryWithChildren,
  UniversalCategoryCreate,
  UniversalCategoryUpdate,
  UniversalInventorySearchFilters,
  UniversalCategorySearchFilters,
  UniversalInventoryItemsResponse,
  UniversalCategoriesResponse,
  InventoryMovementsResponse,
  StockUpdateRequest,
  StockAdjustmentRequest,
  BulkUpdateRequest,
  BulkDeleteRequest,
  BulkTagRequest,
  LowStockAlert,
  StockSummary,
  InventoryAnalytics,
  SearchSuggestionsResponse,
  ImageRecord
} from '../types/universalInventory';

// Legacy types for backward compatibility
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

// Universal Inventory Items API
export const universalInventoryApi = {
  // Search and filter inventory items with advanced options
  searchItems: async (filters: UniversalInventorySearchFilters = {}, page = 1, per_page = 50): Promise<UniversalInventoryItemsResponse> => {
    const params = new URLSearchParams();
    
    // Search parameters
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.category_path) params.append('category_path', filters.category_path);
    if (filters.tags) filters.tags.forEach(tag => params.append('tags', tag));
    
    // Stock filters
    if (filters.min_stock !== undefined) params.append('min_stock', filters.min_stock.toString());
    if (filters.max_stock !== undefined) params.append('max_stock', filters.max_stock.toString());
    if (filters.low_stock_only) params.append('low_stock_only', 'true');
    if (filters.out_of_stock_only) params.append('out_of_stock_only', 'true');
    
    // Price filters
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    
    // Other filters
    if (filters.business_type) params.append('business_type', filters.business_type);
    if (filters.has_images !== undefined) params.append('has_images', filters.has_images.toString());
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.created_after) params.append('created_after', filters.created_after);
    if (filters.created_before) params.append('created_before', filters.created_before);
    
    // Sorting and pagination
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
    params.append('page', page.toString());
    params.append('per_page', per_page.toString());

    const queryString = params.toString();
    const url = `/universal-inventory/items?${queryString}`;
    
    return apiGet<UniversalInventoryItemsResponse>(url);
  },

  // Get single inventory item
  getItem: async (id: string): Promise<UniversalInventoryItemWithCategory> => {
    return apiGet<UniversalInventoryItemWithCategory>(`/universal-inventory/items/${id}`);
  },

  // Create new inventory item
  createItem: async (data: UniversalInventoryItemCreate): Promise<UniversalInventoryItemWithCategory> => {
    return apiPost<UniversalInventoryItemWithCategory, UniversalInventoryItemCreate>('/universal-inventory/items', data);
  },

  // Update inventory item
  updateItem: async (id: string, data: UniversalInventoryItemUpdate): Promise<UniversalInventoryItemWithCategory> => {
    return apiPut<UniversalInventoryItemWithCategory, UniversalInventoryItemUpdate>(`/universal-inventory/items/${id}`, data);
  },

  // Update item stock with movement tracking
  updateStock: async (id: string, stockUpdate: StockUpdateRequest): Promise<UniversalInventoryItemWithCategory> => {
    return apiPatch<UniversalInventoryItemWithCategory, StockUpdateRequest>(`/universal-inventory/items/${id}/stock`, stockUpdate);
  },

  // Adjust item stock to specific quantity
  adjustStock: async (id: string, adjustment: StockAdjustmentRequest): Promise<UniversalInventoryItemWithCategory> => {
    return apiPatch<UniversalInventoryItemWithCategory, StockAdjustmentRequest>(`/universal-inventory/items/${id}/stock/adjust`, adjustment);
  },

  // Delete inventory item
  deleteItem: async (id: string, force = false): Promise<{ message: string }> => {
    const params = force ? '?force=true' : '';
    return apiDelete<{ message: string }>(`/universal-inventory/items/${id}${params}`);
  },

  // Get item movements
  getItemMovements: async (id: string, limit = 50): Promise<InventoryMovementsResponse> => {
    return apiGet<InventoryMovementsResponse>(`/universal-inventory/items/${id}/movements?limit=${limit}`);
  },

  // Bulk operations
  bulkUpdate: async (request: BulkUpdateRequest): Promise<{ message: string; updated_count: number }> => {
    return apiPost<{ message: string; updated_count: number }, BulkUpdateRequest>('/universal-inventory/items/bulk-update', request);
  },

  bulkTag: async (request: BulkTagRequest): Promise<{ message: string; updated_count: number }> => {
    return apiPost<{ message: string; updated_count: number }, BulkTagRequest>('/universal-inventory/items/bulk-tag', request);
  },

  bulkDelete: async (request: BulkDeleteRequest): Promise<{ message: string; deactivated_count: number }> => {
    return apiDelete<{ message: string; deactivated_count: number }>('/universal-inventory/items/bulk-delete', request);
  },

  // Generate barcode/QR code
  getBarcode: async (id: string): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/universal-inventory/items/${id}/barcode`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate barcode');
    }
    
    return response.blob();
  },

  getQRCode: async (id: string): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/universal-inventory/items/${id}/qrcode`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }
    
    return response.blob();
  },

  // Search suggestions
  getSearchSuggestions: async (query: string, limit = 10): Promise<SearchSuggestionsResponse> => {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('limit', limit.toString());
    
    return apiGet<SearchSuggestionsResponse>(`/universal-inventory/search/suggestions?${params.toString()}`);
  },
};

// Universal Categories API
export const universalCategoriesApi = {
  // Get categories in tree structure
  getCategories: async (filters?: UniversalCategorySearchFilters): Promise<UniversalCategoryWithChildren[]> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.parent_id) params.append('parent_id', filters.parent_id);
    if (filters?.level !== undefined) params.append('level', filters.level.toString());
    if (filters?.business_type) params.append('business_type', filters.business_type);
    if (filters?.has_items !== undefined) params.append('has_items', filters.has_items.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const queryString = params.toString();
    const url = queryString ? `/universal-inventory/categories?${queryString}` : '/universal-inventory/categories';
    
    return apiGet<UniversalCategoryWithChildren[]>(url);
  },

  // Get complete category tree with statistics
  getCategoriesTree: async (business_type?: string): Promise<UniversalCategoryWithChildren[]> => {
    const params = new URLSearchParams();
    params.append('include_stats', 'true');
    if (business_type) params.append('business_type', business_type);
    
    return apiGet<UniversalCategoryWithChildren[]>(`/universal-inventory/categories/tree?${params.toString()}`);
  },

  // Get single category
  getCategory: async (id: string): Promise<UniversalCategoryWithChildren> => {
    return apiGet<UniversalCategoryWithChildren>(`/universal-inventory/categories/${id}`);
  },

  // Create new category
  createCategory: async (data: UniversalCategoryCreate): Promise<UniversalCategory> => {
    return apiPost<UniversalCategory, UniversalCategoryCreate>('/universal-inventory/categories', data);
  },

  // Update category
  updateCategory: async (id: string, data: UniversalCategoryUpdate): Promise<UniversalCategory> => {
    return apiPut<UniversalCategory, UniversalCategoryUpdate>(`/universal-inventory/categories/${id}`, data);
  },

  // Delete category
  deleteCategory: async (id: string, force = false): Promise<{ message: string }> => {
    const params = force ? '?force=true' : '';
    return apiDelete<{ message: string }>(`/universal-inventory/categories/${id}${params}`);
  },
};

// Stock Alerts and Monitoring API
export const stockAlertsApi = {
  // Get low stock alerts
  getLowStockAlerts: async (threshold_multiplier = 1.0): Promise<LowStockAlert[]> => {
    return apiGet<LowStockAlert[]>(`/universal-inventory/alerts/low-stock?threshold_multiplier=${threshold_multiplier}`);
  },

  // Get out of stock items
  getOutOfStockItems: async (): Promise<UniversalInventoryItemWithCategory[]> => {
    return apiGet<UniversalInventoryItemWithCategory[]>('/universal-inventory/alerts/out-of-stock');
  },
};

// Analytics and Reporting API
export const inventoryAnalyticsApi = {
  // Get comprehensive inventory analytics
  getAnalytics: async (): Promise<InventoryAnalytics> => {
    return apiGet<InventoryAnalytics>('/universal-inventory/analytics');
  },

  // Get inventory summary statistics
  getSummary: async (): Promise<StockSummary> => {
    return apiGet<StockSummary>('/universal-inventory/summary');
  },
};

// Legacy Inventory Items API (for backward compatibility)
export const inventoryApi = {
  // Get inventory items with filters and pagination
  getItems: async (filters: InventoryFilters = {}): Promise<InventoryListResponse> => {
    // Convert legacy filters to universal filters
    const universalFilters: UniversalInventorySearchFilters = {
      search: filters.search,
      category_id: filters.category_id,
      low_stock_only: filters.low_stock,
    };

    const response = await universalInventoryApi.searchItems(
      universalFilters,
      filters.page || 1,
      filters.limit || 20
    );

    // Convert universal response to legacy format
    return {
      items: response.items.map(item => ({
        id: item.id,
        name: item.name,
        category_id: item.category_id || '',
        weight_grams: item.weight_grams || 0,
        purchase_price: item.cost_price,
        sell_price: item.sale_price,
        stock_quantity: item.stock_quantity,
        min_stock_level: item.low_stock_threshold,
        description: item.description,
        image_url: item.primary_image_id ? `/api/images/${item.primary_image_id}` : null,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      total: response.total,
      page: response.page,
      limit: response.per_page,
      total_pages: response.total_pages,
    };
  },

  // Get single inventory item
  getItem: async (id: string): Promise<InventoryItem> => {
    const item = await universalInventoryApi.getItem(id);
    
    return {
      id: item.id,
      name: item.name,
      category_id: item.category_id || '',
      weight_grams: item.weight_grams || 0,
      purchase_price: item.cost_price,
      sell_price: item.sale_price,
      stock_quantity: item.stock_quantity,
      min_stock_level: item.low_stock_threshold,
      description: item.description,
      image_url: item.primary_image_id ? `/api/images/${item.primary_image_id}` : null,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  },

  // Create new inventory item
  createItem: async (data: CreateInventoryItemData): Promise<InventoryItem> => {
    const universalData: UniversalInventoryItemCreate = {
      name: data.name,
      category_id: data.category_id,
      weight_grams: data.weight_grams,
      cost_price: data.purchase_price,
      sale_price: data.sell_price,
      stock_quantity: data.stock_quantity,
      low_stock_threshold: data.min_stock_level,
      description: data.description,
    };

    const item = await universalInventoryApi.createItem(universalData);
    
    return {
      id: item.id,
      name: item.name,
      category_id: item.category_id || '',
      weight_grams: item.weight_grams || 0,
      purchase_price: item.cost_price,
      sell_price: item.sale_price,
      stock_quantity: item.stock_quantity,
      min_stock_level: item.low_stock_threshold,
      description: item.description,
      image_url: item.primary_image_id ? `/api/images/${item.primary_image_id}` : null,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  },

  // Update inventory item
  updateItem: async (id: string, data: Partial<CreateInventoryItemData>): Promise<InventoryItem> => {
    const universalData: UniversalInventoryItemUpdate = {
      name: data.name,
      category_id: data.category_id,
      weight_grams: data.weight_grams,
      cost_price: data.purchase_price,
      sale_price: data.sell_price,
      stock_quantity: data.stock_quantity,
      low_stock_threshold: data.min_stock_level,
      description: data.description,
    };

    const item = await universalInventoryApi.updateItem(id, universalData);
    
    return {
      id: item.id,
      name: item.name,
      category_id: item.category_id || '',
      weight_grams: item.weight_grams || 0,
      purchase_price: item.cost_price,
      sell_price: item.sale_price,
      stock_quantity: item.stock_quantity,
      min_stock_level: item.low_stock_threshold,
      description: item.description,
      image_url: item.primary_image_id ? `/api/images/${item.primary_image_id}` : null,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  },

  // Delete inventory item
  deleteItem: async (id: string): Promise<void> => {
    await universalInventoryApi.deleteItem(id);
  },

  // Bulk update inventory items
  bulkUpdate: async (data: BulkUpdateData): Promise<{ updated_count: number }> => {
    const universalData: BulkUpdateRequest = {
      item_ids: data.item_ids,
      updates: data.updates,
    };

    const result = await universalInventoryApi.bulkUpdate(universalData);
    return { updated_count: result.updated_count };
  },

  // Upload image for inventory item
  uploadImage: async (file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/image-management/upload`, {
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
    return { image_url: result.url };
  },
};

// Legacy Categories API (for backward compatibility)
export const categoriesApi = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const categories = await universalCategoriesApi.getCategories();
    
    // Convert universal categories to legacy format
    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      parent_id: cat.parent_id,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      attributes: cat.attribute_schema,
      category_metadata: cat.category_metadata,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    }));
  },

  // Get single category
  getCategory: async (id: string): Promise<Category> => {
    const category = await universalCategoriesApi.getCategory(id);
    
    return {
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
      description: category.description,
      icon: category.icon,
      color: category.color,
      attributes: category.attribute_schema,
      category_metadata: category.category_metadata,
      sort_order: category.sort_order,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  },

  // Create new category
  createCategory: async (data: CreateCategoryData): Promise<Category> => {
    const universalData: UniversalCategoryCreate = {
      name: data.name,
      parent_id: data.parent_id,
      description: data.description,
    };

    const category = await universalCategoriesApi.createCategory(universalData);
    
    return {
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
      description: category.description,
      icon: category.icon,
      color: category.color,
      attributes: category.attribute_schema,
      category_metadata: category.category_metadata,
      sort_order: category.sort_order,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  },

  // Update category
  updateCategory: async (id: string, data: Partial<CreateCategoryData>): Promise<Category> => {
    const universalData: UniversalCategoryUpdate = {
      name: data.name,
      parent_id: data.parent_id,
      description: data.description,
    };

    const category = await universalCategoriesApi.updateCategory(id, universalData);
    
    return {
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
      description: category.description,
      icon: category.icon,
      color: category.color,
      attributes: category.attribute_schema,
      category_metadata: category.category_metadata,
      sort_order: category.sort_order,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    await universalCategoriesApi.deleteCategory(id);
  },
};