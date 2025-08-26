/**
 * Universal Inventory Management API Service
 * Enhanced API service for universal inventory system with custom attributes,
 * advanced search, SKU/barcode management, and comprehensive audit trails.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type {
  UniversalInventoryItem,
  UniversalInventoryItemWithCategory,
  UniversalInventoryItemCreate,
  UniversalInventoryItemUpdate,
  UniversalCategory,
  CategoryWithStats,
  UniversalCategoryCreate,
  UniversalCategoryUpdate,
  CategoryHierarchyMove,
  InventorySearchRequest,
  InventorySearchResponse,
  InventoryMovement,
  InventoryMovementWithDetails,
  LowStockAlert,
  StockAlertsResponse,
  UnitConversionRequest,
  UnitConversionResponse,
  BulkInventoryUpdate,
  BulkInventoryResponse,
  BulkStockAdjustment,
  InventoryAnalytics,
  CategoryAnalytics,
  InventoryImportRequest,
  InventoryImportResponse,
  InventoryExportRequest,
  BarcodeGenerationRequest,
  BarcodeGenerationResponse,
  InventoryAuditLog,
  InventoryAuditLogWithUser,
  BusinessInventoryConfig,
  SKUValidationRequest,
  SKUValidationResponse,
  BarcodeValidationRequest,
  BarcodeValidationResponse,
} from '../types/universalInventory';

// Universal Inventory Items API
export const universalInventoryApi = {
  // Search and filtering
  searchItems: async (request: InventorySearchRequest): Promise<InventorySearchResponse> => {
    return await apiPost('/api/v1/inventory/universal/search', request);
  },

  // CRUD operations
  getItem: async (id: string): Promise<UniversalInventoryItemWithCategory> => {
    return await apiGet(`/api/v1/inventory/universal/items/${id}`);
  },

  createItem: async (data: UniversalInventoryItemCreate): Promise<UniversalInventoryItem> => {
    return await apiPost('/api/v1/inventory/universal/items', data);
  },

  updateItem: async (id: string, data: UniversalInventoryItemUpdate): Promise<UniversalInventoryItem> => {
    return await apiPut(`/api/v1/inventory/universal/items/${id}`, data);
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiDelete(`/api/v1/inventory/universal/items/${id}`);
  },

  // Bulk operations
  bulkUpdate: async (data: BulkInventoryUpdate): Promise<BulkInventoryResponse> => {
    return await apiPost('/api/v1/inventory/universal/items/bulk-update', data);
  },

  bulkDelete: async (item_ids: string[]): Promise<BulkInventoryResponse> => {
    return await apiPost('/api/v1/inventory/universal/items/bulk-delete', { item_ids });
  },

  bulkStockAdjustment: async (data: BulkStockAdjustment): Promise<BulkInventoryResponse> => {
    return await apiPost('/api/v1/inventory/universal/items/bulk-stock-adjustment', data);
  },

  // Stock management
  adjustStock: async (id: string, quantity_change: number, reason?: string): Promise<UniversalInventoryItem> => {
    return await apiPost(`/api/v1/inventory/universal/items/${id}/adjust-stock`, {
      quantity_change,
      reason,
    });
  },

  // Validation
  validateSKU: async (data: SKUValidationRequest): Promise<SKUValidationResponse> => {
    return await apiPost('/api/v1/inventory/universal/validate-sku', data);
  },

  validateBarcode: async (data: BarcodeValidationRequest): Promise<BarcodeValidationResponse> => {
    return await apiPost('/api/v1/inventory/universal/validate-barcode', data);
  },

  // Unit conversion
  convertUnits: async (data: UnitConversionRequest): Promise<UnitConversionResponse> => {
    return await apiPost('/api/v1/inventory/universal/convert-units', data);
  },
};

// Universal Categories API
export const universalCategoriesApi = {
  // Hierarchical category management
  getCategoryTree: async (business_type?: string, include_stats = true, max_depth?: number): Promise<CategoryWithStats[]> => {
    const params = new URLSearchParams();
    if (business_type) params.append('business_type', business_type);
    if (include_stats) params.append('include_stats', 'true');
    if (max_depth) params.append('max_depth', max_depth.toString());

    return await apiGet(`/api/v1/inventory/universal/categories/tree?${params}`);
  },

  getCategory: async (id: string): Promise<UniversalCategory> => {
    return await apiGet(`/api/v1/inventory/universal/categories/${id}`);
  },

  createCategory: async (data: UniversalCategoryCreate): Promise<UniversalCategory> => {
    return await apiPost('/api/v1/inventory/universal/categories', data);
  },

  updateCategory: async (id: string, data: UniversalCategoryUpdate): Promise<UniversalCategory> => {
    return await apiPut(`/api/v1/inventory/universal/categories/${id}`, data);
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiDelete(`/api/v1/inventory/universal/categories/${id}`);
  },

  // Hierarchy management
  moveCategory: async (data: CategoryHierarchyMove): Promise<UniversalCategory> => {
    return await apiPost('/api/v1/inventory/universal/categories/move', data);
  },

  // Category analytics
  getCategoryAnalytics: async (id: string): Promise<CategoryAnalytics> => {
    return await apiGet(`/api/v1/inventory/universal/categories/${id}/analytics`);
  },
};

// Inventory Movements API
export const inventoryMovementsApi = {
  getMovements: async (
    item_id?: string,
    movement_types?: string[],
    date_from?: string,
    date_to?: string,
    limit = 100,
    offset = 0
  ): Promise<{ movements: InventoryMovementWithDetails[]; total_count: number }> => {
    const params = new URLSearchParams();
    if (item_id) params.append('item_id', item_id);
    if (movement_types) movement_types.forEach(type => params.append('movement_types', type));
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return await apiGet(`/api/v1/inventory/universal/movements?${params}`);
  },

  getMovement: async (id: string): Promise<InventoryMovementWithDetails> => {
    return await apiGet(`/api/v1/inventory/universal/movements/${id}`);
  },
};

// Stock Alerts API
export const stockAlertsApi = {
  getLowStockAlerts: async (
    threshold_multiplier = 1.0,
    category_ids?: string[],
    business_type?: string
  ): Promise<StockAlertsResponse> => {
    const params = new URLSearchParams();
    params.append('threshold_multiplier', threshold_multiplier.toString());
    if (category_ids) category_ids.forEach(id => params.append('category_ids', id));
    if (business_type) params.append('business_type', business_type);

    return await apiGet(`/api/v1/inventory/universal/alerts/low-stock?${params}`);
  },

  getOutOfStockItems: async (category_ids?: string[], business_type?: string): Promise<LowStockAlert[]> => {
    const params = new URLSearchParams();
    if (category_ids) category_ids.forEach(id => params.append('category_ids', id));
    if (business_type) params.append('business_type', business_type);

    return await apiGet(`/api/v1/inventory/universal/alerts/out-of-stock?${params}`);
  },
};

// Analytics API
export const inventoryAnalyticsApi = {
  getOverallAnalytics: async (business_type?: string): Promise<InventoryAnalytics> => {
    const params = new URLSearchParams();
    if (business_type) params.append('business_type', business_type);

    return await apiGet(`/api/v1/inventory/universal/analytics/overview?${params}`);
  },

  getCategoryAnalytics: async (category_id: string): Promise<CategoryAnalytics> => {
    return await apiGet(`/api/v1/inventory/universal/analytics/categories/${category_id}`);
  },

  getInventoryTurnover: async (
    date_from: string,
    date_to: string,
    category_ids?: string[]
  ): Promise<{ turnover_rate: number; details: Record<string, any> }> => {
    const params = new URLSearchParams();
    params.append('date_from', date_from);
    params.append('date_to', date_to);
    if (category_ids) category_ids.forEach(id => params.append('category_ids', id));

    return await apiGet(`/api/v1/inventory/universal/analytics/turnover?${params}`);
  },
};

// Import/Export API
export const inventoryImportExportApi = {
  importItems: async (data: InventoryImportRequest): Promise<InventoryImportResponse> => {
    return await apiPost('/api/v1/inventory/universal/import', data);
  },

  exportItems: async (data: InventoryExportRequest): Promise<{ download_url: string; export_id: string }> => {
    return await apiPost('/api/v1/inventory/universal/export', data);
  },

  getImportStatus: async (import_id: string): Promise<InventoryImportResponse> => {
    return await apiGet(`/api/v1/inventory/universal/import/${import_id}/status`);
  },

  downloadExport: async (export_id: string): Promise<Blob> => {
    // Note: This might need special handling for blob responses
    return await apiGet(`/api/v1/inventory/universal/export/${export_id}/download`);
  },
};

// Barcode/QR Code API
export const barcodeApi = {
  generateBarcodes: async (data: BarcodeGenerationRequest): Promise<BarcodeGenerationResponse> => {
    return await apiPost('/api/v1/inventory/universal/barcodes/generate', data);
  },

  scanBarcode: async (barcode_data: string): Promise<UniversalInventoryItemWithCategory | null> => {
    return await apiPost('/api/v1/inventory/universal/barcodes/scan', { barcode_data });
  },

  printBarcodes: async (generation_id: string): Promise<{ print_url: string }> => {
    return await apiPost(`/api/v1/inventory/universal/barcodes/${generation_id}/print`);
  },
};

// Audit Trail API
export const inventoryAuditApi = {
  getAuditLogs: async (
    resource_type?: string,
    resource_id?: string,
    user_id?: string,
    action?: string,
    date_from?: string,
    date_to?: string,
    limit = 100,
    offset = 0
  ): Promise<{ logs: InventoryAuditLogWithUser[]; total_count: number }> => {
    const params = new URLSearchParams();
    if (resource_type) params.append('resource_type', resource_type);
    if (resource_id) params.append('resource_id', resource_id);
    if (user_id) params.append('user_id', user_id);
    if (action) params.append('action', action);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return await apiGet(`/api/v1/inventory/universal/audit?${params}`);
  },

  getItemAuditTrail: async (item_id: string, limit = 50, offset = 0): Promise<{ logs: InventoryAuditLogWithUser[]; total_count: number }> => {
    return await apiGet(`/api/v1/inventory/universal/items/${item_id}/audit?limit=${limit}&offset=${offset}`);
  },

  getCategoryAuditTrail: async (category_id: string, limit = 50, offset = 0): Promise<{ logs: InventoryAuditLogWithUser[]; total_count: number }> => {
    return await apiGet(`/api/v1/inventory/universal/categories/${category_id}/audit?limit=${limit}&offset=${offset}`);
  },
};

// Business Configuration API
export const businessInventoryConfigApi = {
  getConfig: async (business_type: string): Promise<BusinessInventoryConfig> => {
    return await apiGet(`/api/v1/inventory/universal/config/${business_type}`);
  },

  updateConfig: async (business_type: string, config: Partial<BusinessInventoryConfig>): Promise<BusinessInventoryConfig> => {
    return await apiPut(`/api/v1/inventory/universal/config/${business_type}`, config);
  },

  getDefaultConfig: async (): Promise<BusinessInventoryConfig> => {
    return await apiGet('/api/v1/inventory/universal/config/default');
  },
};

// Image Management API (for inventory items)
export const inventoryImageApi = {
  uploadImage: async (file: File, item_id?: string): Promise<{ image_url: string; image_id: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (item_id) formData.append('item_id', item_id);

    // Note: File upload might need special handling
    return await apiPost('/api/v1/inventory/universal/images/upload', formData);
  },

  deleteImage: async (image_id: string): Promise<void> => {
    await apiDelete(`/api/v1/inventory/universal/images/${image_id}`);
  },

  getItemImages: async (item_id: string): Promise<Array<{ id: string; url: string; is_primary: boolean }>> => {
    return await apiGet(`/api/v1/inventory/universal/items/${item_id}/images`);
  },

  setPrimaryImage: async (item_id: string, image_id: string): Promise<void> => {
    await apiPost(`/api/v1/inventory/universal/items/${item_id}/images/${image_id}/set-primary`);
  },
};