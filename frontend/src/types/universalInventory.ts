/**
 * Universal Inventory Management System Types
 * Enhanced types for the universal inventory and invoice management system
 */

import { UUID } from 'crypto';

// Business Configuration Types
export interface BusinessConfiguration {
  id: string;
  business_type: string;
  business_name: string;
  configuration: Record<string, any>;
  terminology_mapping: Record<string, string>;
  workflow_config: Record<string, any>;
  feature_flags: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

// Universal Category Types
export interface AttributeDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  required: boolean;
  searchable: boolean;
  filterable: boolean;
  options?: string[];
  validation?: Record<string, any>;
  default_value?: any;
  display_order: number;
}

export interface UniversalCategory {
  id: string;
  name: string;
  name_persian?: string;
  parent_id?: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  attribute_schema: AttributeDefinition[];
  image_id?: string;
  business_type: string;
  category_metadata: Record<string, any>;
  path: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface UniversalCategoryWithChildren extends UniversalCategory {
  children: UniversalCategoryWithChildren[];
  parent?: UniversalCategory;
}

export interface UniversalCategoryWithStats extends UniversalCategory {
  children: UniversalCategoryWithStats[];
  item_count: number;
  total_value: number;
}

export interface UniversalCategoryCreate {
  name: string;
  name_persian?: string;
  parent_id?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  attribute_schema?: AttributeDefinition[];
  image_id?: string;
  business_type?: string;
  category_metadata?: Record<string, any>;
}

export interface UniversalCategoryUpdate {
  name?: string;
  name_persian?: string;
  parent_id?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  attribute_schema?: AttributeDefinition[];
  image_id?: string;
  business_type?: string;
  category_metadata?: Record<string, any>;
  is_active?: boolean;
}

// Universal Inventory Item Types
export interface CustomAttribute {
  name: string;
  value: any;
  type: string;
}

export interface UniversalInventoryItem {
  id: string;
  sku: string;
  barcode?: string;
  qr_code?: string;
  name: string;
  name_persian?: string;
  description?: string;
  description_persian?: string;
  category_id?: string;
  
  // Pricing
  cost_price: number;
  sale_price: number;
  currency: string;
  
  // Inventory tracking
  stock_quantity: number;
  unit_of_measure: string;
  low_stock_threshold: number;
  reorder_point: number;
  max_stock_level?: number;
  
  // Universal attributes and tags
  custom_attributes: Record<string, any>;
  tags: string[];
  
  // Images
  primary_image_id?: string;
  image_ids: string[];
  
  // Business type specific fields
  business_type_fields: Record<string, any>;
  
  // Gold shop compatibility
  weight_grams?: number;
  gold_specific?: Record<string, any>;
  
  // Metadata
  item_metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface UniversalInventoryItemWithCategory extends UniversalInventoryItem {
  category?: UniversalCategory;
}

export interface UniversalInventoryItemWithImages extends UniversalInventoryItem {
  category?: UniversalCategory;
  primary_image?: ImageRecord;
  images: ImageRecord[];
}

export interface UniversalInventoryItemCreate {
  sku?: string;
  barcode?: string;
  qr_code?: string;
  name: string;
  name_persian?: string;
  description?: string;
  description_persian?: string;
  category_id?: string;
  cost_price: number;
  sale_price: number;
  currency?: string;
  stock_quantity: number;
  unit_of_measure?: string;
  low_stock_threshold: number;
  reorder_point?: number;
  max_stock_level?: number;
  custom_attributes?: Record<string, any>;
  tags?: string[];
  primary_image_id?: string;
  image_ids?: string[];
  business_type_fields?: Record<string, any>;
  weight_grams?: number;
  gold_specific?: Record<string, any>;
  item_metadata?: Record<string, any>;
}

export interface UniversalInventoryItemUpdate {
  sku?: string;
  barcode?: string;
  qr_code?: string;
  name?: string;
  name_persian?: string;
  description?: string;
  description_persian?: string;
  category_id?: string;
  cost_price?: number;
  sale_price?: number;
  currency?: string;
  stock_quantity?: number;
  unit_of_measure?: string;
  low_stock_threshold?: number;
  reorder_point?: number;
  max_stock_level?: number;
  custom_attributes?: Record<string, any>;
  tags?: string[];
  primary_image_id?: string;
  image_ids?: string[];
  business_type_fields?: Record<string, any>;
  weight_grams?: number;
  gold_specific?: Record<string, any>;
  item_metadata?: Record<string, any>;
  is_active?: boolean;
}

// Inventory Movement Types
export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_of_measure: string;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  reason?: string;
  notes?: string;
  location_from?: string;
  location_to?: string;
  batch_number?: string;
  lot_number?: string;
  expiry_date?: string;
  status: string;
  movement_date: string;
  created_at: string;
  created_by?: string;
}

export interface InventoryMovementWithItem extends InventoryMovement {
  inventory_item?: UniversalInventoryItem;
}

// Search and Filter Types
export interface UniversalInventorySearchFilters {
  search?: string;
  category_id?: string;
  category_path?: string;
  tags?: string[];
  custom_attributes?: Record<string, any>;
  min_stock?: number;
  max_stock?: number;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
  min_price?: number;
  max_price?: number;
  business_type?: string;
  has_images?: boolean;
  is_active?: boolean;
  created_after?: string;
  created_before?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UniversalCategorySearchFilters {
  search?: string;
  parent_id?: string;
  level?: number;
  business_type?: string;
  has_items?: boolean;
  is_active?: boolean;
}

// Stock Management Types
export interface StockUpdateRequest {
  quantity_change: number;
  reason?: string;
  notes?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface StockAdjustmentRequest {
  new_quantity: number;
  reason: string;
  notes?: string;
}

export interface LowStockAlert {
  item_id: string;
  item_name: string;
  item_sku: string;
  category_name?: string;
  current_stock: number;
  low_stock_threshold: number;
  shortage: number;
  unit_of_measure: string;
  last_movement_date?: string;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface StockSummary {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  categories_count: number;
  recent_movements: number;
}

// Bulk Operations Types
export interface BulkUpdateRequest {
  item_ids: string[];
  updates: Record<string, any>;
}

export interface BulkDeleteRequest {
  item_ids: string[];
  force?: boolean;
}

export interface BulkTagRequest {
  item_ids: string[];
  tags: string[];
  operation: 'add' | 'remove' | 'replace';
}

// Image Management Types
export interface ImageRecord {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  context_type: 'category' | 'item' | 'invoice' | 'user' | 'company';
  context_id?: string;
  alt_text?: string;
  caption?: string;
  image_metadata: Record<string, any>;
  file_path: string;
  url: string;
  thumbnail_url?: string;
  medium_url?: string;
  processing_status: string;
  processing_error?: string;
  storage_provider: string;
  storage_path?: string;
  storage_metadata: Record<string, any>;
  is_active: boolean;
  uploaded_by?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface ImageVariant {
  id: string;
  parent_image_id: string;
  variant_type: string;
  width: number;
  height: number;
  filename: string;
  file_path: string;
  file_size: number;
  url: string;
  processing_status: string;
  created_at: string;
}

export interface ImageWithVariants extends ImageRecord {
  variants: ImageVariant[];
}

export interface ImageCreate {
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  width?: number;
  height?: number;
  context_type: 'category' | 'item' | 'invoice' | 'user' | 'company';
  context_id?: string;
  alt_text?: string;
  caption?: string;
  image_metadata?: Record<string, any>;
  file_path: string;
  url: string;
}

export interface ImageUpdate {
  alt_text?: string;
  caption?: string;
  image_metadata?: Record<string, any>;
  is_active?: boolean;
}

// Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UniversalInventoryItemsResponse extends PaginatedResponse<UniversalInventoryItemWithCategory> {}

export interface UniversalCategoriesResponse extends PaginatedResponse<UniversalCategoryWithStats> {}

export interface InventoryMovementsResponse extends PaginatedResponse<InventoryMovementWithItem> {}

// Analytics and Reporting Types
export interface InventoryAnalytics {
  total_items: number;
  total_value: number;
  categories_count: number;
  low_stock_items: number;
  out_of_stock_items: number;
  top_categories: Array<Record<string, any>>;
  recent_movements: Array<Record<string, any>>;
  stock_distribution: Record<string, number>;
  value_distribution: Record<string, number>;
}

export interface CategoryAnalytics {
  category_id: string;
  category_name: string;
  items_count: number;
  total_value: number;
  average_price: number;
  stock_turnover: number;
  low_stock_items: number;
  subcategories_count: number;
}

// Search Suggestions Types
export interface SearchSuggestion {
  id: string;
  name: string;
  sku?: string;
  type: 'item' | 'category';
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

// Tree View Types
export interface CategoryTreeNode extends UniversalCategoryWithChildren {
  expanded?: boolean;
  selected?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
}

// Form Types
export interface CategoryFormData extends UniversalCategoryCreate {
  template_id?: string;
}

export interface ItemFormData extends UniversalInventoryItemCreate {
  images?: File[];
}

// Filter Preset Types
export interface UniversalFilterPreset {
  id: string;
  name: string;
  filters: UniversalInventorySearchFilters;
  is_default?: boolean;
  created_at: string;
  user_id?: string;
}

// Barcode and QR Code Types
export interface BarcodeGenerationRequest {
  item_id: string;
  format?: 'png' | 'svg';
  width?: number;
  height?: number;
}

export interface QRCodeGenerationRequest {
  item_id: string;
  format?: 'png' | 'svg';
  size?: number;
}

// Mobile and Responsive Types
export interface MobileInventoryView {
  view_mode: 'list' | 'grid' | 'card';
  items_per_page: number;
  show_images: boolean;
  show_stock_status: boolean;
  compact_mode: boolean;
}

// Real-time Updates Types
export interface InventoryUpdateEvent {
  type: 'item_created' | 'item_updated' | 'item_deleted' | 'stock_changed' | 'category_changed';
  item_id?: string;
  category_id?: string;
  data: any;
  timestamp: string;
}

// Navigation and Menu Types
export interface InventoryNavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  children?: InventoryNavigationItem[];
}

// Component Props Types
export interface UniversalInventoryPageProps {
  initialFilters?: UniversalInventorySearchFilters;
  view_mode?: 'list' | 'grid';
  show_categories?: boolean;
  show_filters?: boolean;
}

export interface CategoryTreeProps {
  categories: UniversalCategoryWithChildren[];
  selected_category?: string;
  expanded_categories?: Set<string>;
  on_category_select?: (category: UniversalCategory) => void;
  on_category_edit?: (category: UniversalCategory) => void;
  on_category_delete?: (category: UniversalCategory) => void;
  on_category_add?: (parent_id?: string) => void;
  on_toggle_expanded?: (category_id: string) => void;
  drag_enabled?: boolean;
  on_drag_start?: (category: UniversalCategory) => void;
  on_drop?: (dragged: UniversalCategory, target: UniversalCategory) => void;
}

export interface ItemFormProps {
  item?: UniversalInventoryItem;
  categories: UniversalCategory[];
  on_submit: (data: UniversalInventoryItemCreate | UniversalInventoryItemUpdate) => Promise<void>;
  on_cancel: () => void;
  is_loading?: boolean;
}

export interface AdvancedSearchProps {
  categories: UniversalCategory[];
  filters: UniversalInventorySearchFilters;
  on_filters_change: (filters: UniversalInventorySearchFilters) => void;
  presets?: UniversalFilterPreset[];
  on_save_preset?: (name: string, filters: UniversalInventorySearchFilters) => void;
  on_delete_preset?: (preset_id: string) => void;
}

export interface ImageManagerProps {
  context_type: 'category' | 'item';
  context_id: string;
  images: ImageRecord[];
  on_upload: (files: File[]) => Promise<void>;
  on_delete: (image_id: string) => Promise<void>;
  on_set_primary: (image_id: string) => Promise<void>;
  max_images?: number;
  allowed_types?: string[];
}

export interface StockMonitorProps {
  items: UniversalInventoryItem[];
  alerts: LowStockAlert[];
  on_stock_update: (item_id: string, new_quantity: number, reason: string) => Promise<void>;
  on_reorder: (item_id: string) => Promise<void>;
  real_time_updates?: boolean;
}

// Error Types
export interface UniversalInventoryError {
  code: string;
  message: string;
  message_persian?: string;
  details?: any;
  timestamp: string;
  request_id: string;
  context: {
    business_type?: string;
    affected_resources: string[];
    user_action?: string;
  };
  suggestions?: string[];
}

// Validation Types
export interface ValidationRule {
  field: string;
  rule: string;
  value?: any;
  message: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
}