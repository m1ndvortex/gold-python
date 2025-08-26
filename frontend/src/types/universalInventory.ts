/**
 * Universal Inventory Management Types
 * Enhanced types for universal inventory system with custom attributes,
 * advanced search, SKU/barcode management, and comprehensive audit trails.
 */

// Attribute Type Definitions
export type AttributeType = 'text' | 'number' | 'date' | 'enum' | 'boolean' | 'multi_select' | 'url' | 'email';

// Custom Attribute Schemas
export interface AttributeDefinition {
  name: string;
  label: string;
  type: AttributeType;
  required: boolean;
  searchable: boolean;
  options?: string[]; // For enum and multi_select types
  validation?: Record<string, any>; // Additional validation rules
  default_value?: string | number | boolean | string[];
  help_text?: string;
  display_order: number;
}

export interface AttributeValue {
  name: string;
  value: string | number | boolean | string[];
  type: AttributeType;
}

// Enhanced Category Types
export interface UniversalCategory {
  id: string;
  name: string;
  parent_id?: string;
  description?: string;
  icon?: string;
  color?: string; // Hex color
  business_type?: string;
  attribute_schema: AttributeDefinition[];
  category_metadata: Record<string, any>;
  sort_order: number;
  path?: string; // LTREE path
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithStats extends UniversalCategory {
  children: CategoryWithStats[];
  product_count: number;
  total_stock: number;
  total_value: number;
}

export interface CategoryHierarchyMove {
  category_id: string;
  new_parent_id?: string;
  new_sort_order?: number;
}

// Enhanced Inventory Item Types
export interface UniversalInventoryItem {
  id: string;
  
  // Universal identifiers
  sku?: string;
  barcode?: string;
  qr_code?: string;
  
  // Basic information
  name: string;
  category_id?: string;
  description?: string;
  
  // Pricing (universal)
  cost_price?: number;
  sale_price?: number;
  currency: string;
  
  // Inventory tracking
  stock_quantity: number;
  min_stock_level: number;
  unit_of_measure?: string;
  conversion_factors?: Record<string, number>;
  
  // Universal attributes
  attributes: Record<string, any>;
  tags: string[];
  
  // Business type specific fields
  business_type_fields: Record<string, any>;
  
  // Gold shop compatibility (legacy fields)
  weight_grams?: number;
  purchase_price?: number; // Legacy field
  sell_price?: number; // Legacy field
  gold_specific?: Record<string, any>;
  
  // Metadata
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UniversalInventoryItemWithCategory extends UniversalInventoryItem {
  category?: UniversalCategory;
}

// Advanced Search Types
export interface InventorySearchFilters {
  query?: string; // Text search
  category_ids?: string[];
  attributes_filter?: Record<string, any>;
  tags_filter?: string[];
  sku_filter?: string;
  barcode_filter?: string;
  business_type?: string;
  include_inactive: boolean;
  
  // Stock level filters
  min_stock?: number;
  max_stock?: number;
  low_stock_only: boolean;
  out_of_stock_only: boolean;
  
  // Price range filters
  min_cost_price?: number;
  max_cost_price?: number;
  min_sale_price?: number;
  max_sale_price?: number;
  
  // Date filters
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  
  // Sorting
  sort_by?: 'name' | 'sku' | 'stock_quantity' | 'cost_price' | 'sale_price' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface InventorySearchRequest {
  filters: InventorySearchFilters;
  sort_by: 'name' | 'sku' | 'stock_quantity' | 'cost_price' | 'sale_price' | 'created_at' | 'updated_at';
  sort_order: 'asc' | 'desc';
  limit: number;
  offset: number;
}

export interface InventorySearchResponse {
  items: UniversalInventoryItemWithCategory[];
  total_count: number;
  page_info: Record<string, any>;
  filters_applied: InventorySearchFilters;
}

// Inventory Movement Types
export type InventoryMovementType = 
  | 'initial_stock'
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'transfer'
  | 'return'
  | 'damage'
  | 'theft'
  | 'expiry';

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  movement_type: InventoryMovementType;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string; // invoice, purchase_order, etc.
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface InventoryMovementWithDetails extends InventoryMovement {
  inventory_item?: UniversalInventoryItem;
  creator?: Record<string, any>; // User info
}

// Stock Alert Types
export type StockAlertLevel = 'out_of_stock' | 'critical' | 'low' | 'warning';

export interface LowStockAlert {
  item_id: string;
  item_name: string;
  sku?: string;
  category_name?: string;
  current_stock: number;
  min_stock_level: number;
  shortage: number;
  urgency_score: number;
  alert_level: StockAlertLevel;
  unit_cost: number;
  potential_lost_sales: number;
  last_movement_date?: string;
}

export interface StockAlertsResponse {
  alerts: LowStockAlert[];
  summary: Record<string, any>;
  threshold_multiplier: number;
}

// Unit Conversion Types
export interface UnitConversionRequest {
  item_id: string;
  from_unit: string;
  to_unit: string;
  quantity: number;
}

export interface UnitConversionResponse {
  original_quantity: number;
  original_unit: string;
  converted_quantity: number;
  converted_unit: string;
  conversion_factor: number;
}

// Bulk Operations Types
export interface BulkInventoryUpdate {
  item_ids: string[];
  updates: Record<string, any>;
}

export interface BulkInventoryResponse {
  success_count: number;
  error_count: number;
  errors: Array<Record<string, any>>;
  message: string;
}

export interface BulkStockAdjustment {
  adjustments: Array<{
    item_id: string;
    quantity_change: number;
    reason: string;
  }>;
}

// Inventory Analytics Types
export interface InventoryAnalytics {
  total_items: number;
  total_categories: number;
  total_inventory_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  top_categories_by_value: Array<Record<string, any>>;
  top_items_by_value: Array<Record<string, any>>;
  inventory_turnover?: number;
  last_updated: string;
}

export interface CategoryAnalytics {
  category_id: string;
  category_name: string;
  item_count: number;
  total_stock: number;
  total_value: number;
  average_item_value: number;
  low_stock_items: number;
  subcategories_count: number;
}

// Import/Export Types
export interface InventoryImportRequest {
  file_format: 'csv' | 'xlsx' | 'json';
  mapping: Record<string, string>; // Field mapping
  options: Record<string, any>;
}

export interface InventoryImportResponse {
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: Array<Record<string, any>>;
  import_id: string;
}

export interface InventoryExportRequest {
  filters?: InventorySearchFilters;
  fields: string[]; // Fields to export
  format: 'csv' | 'xlsx' | 'json';
  include_categories: boolean;
  include_movements: boolean;
}

// Barcode/QR Code Types
export interface BarcodeGenerationRequest {
  item_ids: string[];
  barcode_type: 'CODE128' | 'EAN13' | 'QR';
  include_text: boolean;
  size: 'small' | 'medium' | 'large';
}

export interface BarcodeGenerationResponse {
  barcodes: Array<{
    item_id: string;
    barcode_url: string;
    barcode_data: string;
  }>;
  generation_id: string;
}

// Audit Trail Types
export interface InventoryAuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface InventoryAuditLogWithUser extends InventoryAuditLog {
  user?: Record<string, any>; // User info
}

// Business Configuration Types
export interface BusinessInventoryConfig {
  business_type: string;
  default_unit_of_measure: string;
  enable_multi_unit: boolean;
  enable_barcode_scanning: boolean;
  enable_qr_codes: boolean;
  auto_generate_sku: boolean;
  sku_prefix?: string;
  low_stock_threshold_multiplier: number;
  enable_batch_tracking: boolean;
  enable_expiry_tracking: boolean;
  custom_fields: AttributeDefinition[];
}

// Validation Types
export interface SKUValidationRequest {
  sku: string;
  exclude_item_id?: string;
}

export interface SKUValidationResponse {
  is_valid: boolean;
  is_unique: boolean;
  suggested_sku?: string;
  errors: string[];
}

export interface BarcodeValidationRequest {
  barcode: string;
  exclude_item_id?: string;
}

export interface BarcodeValidationResponse {
  is_valid: boolean;
  is_unique: boolean;
  format_detected?: string;
  errors: string[];
}

// Form Types
export interface UniversalInventoryItemCreate {
  sku?: string;
  barcode?: string;
  qr_code?: string;
  name: string;
  category_id?: string;
  description?: string;
  cost_price?: number;
  sale_price?: number;
  currency?: string;
  stock_quantity: number;
  min_stock_level: number;
  unit_of_measure?: string;
  conversion_factors?: Record<string, number>;
  attributes?: Record<string, any>;
  tags?: string[];
  business_type_fields?: Record<string, any>;
  weight_grams?: number;
  purchase_price?: number;
  sell_price?: number;
  gold_specific?: Record<string, any>;
  image_url?: string;
}

export interface UniversalInventoryItemUpdate extends Partial<UniversalInventoryItemCreate> {
  is_active?: boolean;
}

export interface UniversalCategoryCreate {
  name: string;
  parent_id?: string;
  description?: string;
  icon?: string;
  color?: string;
  business_type?: string;
  attribute_schema?: AttributeDefinition[];
  category_metadata?: Record<string, any>;
  sort_order?: number;
}

export interface UniversalCategoryUpdate extends Partial<UniversalCategoryCreate> {
  is_active?: boolean;
}