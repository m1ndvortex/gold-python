/**
 * Advanced Search and Filtering System Types
 * Comprehensive types for universal search across inventory, invoices, customers, and accounting
 */

// Base Search Types
export type SearchEntityType = 'inventory' | 'invoices' | 'customers' | 'accounting';

export interface BaseSearchFilters {
  search?: string;
  entity_types?: SearchEntityType[];
  date_range?: {
    from?: Date;
    to?: Date;
  };
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// Universal Search Filters
export interface UniversalSearchFilters extends BaseSearchFilters {
  // Inventory specific
  inventory?: {
    category_ids?: string[];
    category_paths?: string[];
    tags?: string[];
    custom_attributes?: Record<string, any>;
    price_range?: { min?: number; max?: number };
    stock_range?: { min?: number; max?: number };
    business_type?: string;
    has_images?: boolean;
    is_active?: boolean;
  };
  
  // Invoice specific
  invoices?: {
    types?: ('gold' | 'general')[];
    statuses?: string[];
    workflow_stages?: string[];
    payment_statuses?: string[];
    customer_ids?: string[];
    amount_range?: { min?: number; max?: number };
    has_remaining_amount?: boolean;
    approved_by?: string[];
  };
  
  // Customer specific
  customers?: {
    customer_types?: string[];
    has_debt?: boolean;
    debt_range?: { min?: number; max?: number };
    cities?: string[];
    countries?: string[];
    is_active?: boolean;
    blacklisted?: boolean;
  };
  
  // Accounting specific
  accounting?: {
    entry_types?: string[];
    account_types?: string[];
    subsidiary_types?: string[];
    check_statuses?: string[];
    installment_statuses?: string[];
    amount_range?: { min?: number; max?: number };
    fiscal_years?: number[];
    accounting_periods?: string[];
  };
}

// Search Result Types
export interface SearchResultItem {
  id: string;
  entity_type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  metadata: Record<string, any>;
  relevance_score: number;
  highlighted_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface SearchResults {
  items: SearchResultItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  facets: SearchFacets;
  suggestions: string[];
  search_time_ms: number;
}

// Search Facets for Dynamic Filtering
export interface SearchFacet {
  name: string;
  label: string;
  type: 'checkbox' | 'range' | 'date_range' | 'select' | 'multi_select';
  options?: SearchFacetOption[];
  range?: { min: number; max: number };
  selected_values?: any[];
}

export interface SearchFacetOption {
  value: string;
  label: string;
  count: number;
  selected?: boolean;
}

export interface SearchFacets {
  entity_types: SearchFacet;
  categories: SearchFacet;
  tags: SearchFacet;
  price_range: SearchFacet;
  date_range: SearchFacet;
  status: SearchFacet;
  custom_attributes: SearchFacet[];
}

// Filter Preset Types
export interface SearchFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: UniversalSearchFilters;
  entity_types: SearchEntityType[];
  is_default?: boolean;
  is_public?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at?: string;
}

export interface SearchFilterPresetCreate {
  name: string;
  description?: string;
  filters: UniversalSearchFilters;
  entity_types: SearchEntityType[];
  is_default?: boolean;
  is_public?: boolean;
}

export interface SearchFilterPresetUpdate {
  name?: string;
  description?: string;
  filters?: UniversalSearchFilters;
  entity_types?: SearchEntityType[];
  is_default?: boolean;
  is_public?: boolean;
}

// Search Suggestions Types
export interface SearchSuggestion {
  text: string;
  type: 'query' | 'filter' | 'entity';
  entity_type?: SearchEntityType;
  count?: number;
  metadata?: Record<string, any>;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
  categories: string[];
  tags: string[];
  recent_searches: string[];
}

// Advanced Filter Types
export interface AttributeFilter {
  attribute_name: string;
  attribute_type: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  values?: any[];
}

export interface CategoryHierarchyFilter {
  category_id: string;
  include_children: boolean;
  level?: number;
}

export interface TagFilter {
  tags: string[];
  match_type: 'any' | 'all' | 'none';
}

export interface CombinedFilter {
  logic: 'AND' | 'OR';
  filters: (AttributeFilter | CategoryHierarchyFilter | TagFilter | CombinedFilter)[];
}

// Search Analytics Types
export interface SearchAnalytics {
  total_searches: number;
  unique_users: number;
  average_results_per_search: number;
  most_searched_terms: Array<{ term: string; count: number }>;
  most_used_filters: Array<{ filter: string; count: number }>;
  search_performance: {
    average_response_time_ms: number;
    slow_queries: Array<{ query: string; time_ms: number }>;
  };
  entity_type_distribution: Record<SearchEntityType, number>;
  conversion_rates: {
    search_to_view: number;
    search_to_action: number;
  };
}

// Search Configuration Types
export interface SearchConfiguration {
  enabled_entities: SearchEntityType[];
  default_per_page: number;
  max_per_page: number;
  search_timeout_ms: number;
  enable_fuzzy_search: boolean;
  enable_autocomplete: boolean;
  enable_search_analytics: boolean;
  boost_factors: Record<string, number>;
  stop_words: string[];
  synonyms: Record<string, string[]>;
}

// Mobile Search Types
export interface MobileSearchConfig {
  compact_mode: boolean;
  show_entity_icons: boolean;
  show_thumbnails: boolean;
  max_description_length: number;
  enable_voice_search: boolean;
  enable_barcode_scan: boolean;
  enable_qr_scan: boolean;
}

// Search History Types
export interface SearchHistoryEntry {
  id: string;
  query: string;
  filters: UniversalSearchFilters;
  entity_types: SearchEntityType[];
  results_count: number;
  clicked_result_id?: string;
  search_time_ms: number;
  created_at: string;
  user_id?: string;
}

// Export Types
export interface SearchExportRequest {
  filters: UniversalSearchFilters;
  entity_types: SearchEntityType[];
  format: 'csv' | 'excel' | 'pdf';
  include_images?: boolean;
  max_results?: number;
}

export interface SearchExportResponse {
  export_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  file_size?: number;
  expires_at: string;
  created_at: string;
}

// Component Props Types
export interface UniversalSearchProps {
  initialFilters?: UniversalSearchFilters;
  enabledEntities?: SearchEntityType[];
  onResultClick?: (result: SearchResultItem) => void;
  onFiltersChange?: (filters: UniversalSearchFilters) => void;
  showPresets?: boolean;
  showAnalytics?: boolean;
  mobileConfig?: MobileSearchConfig;
}

export interface SearchFiltersProps {
  filters: UniversalSearchFilters;
  facets: SearchFacets;
  onFiltersChange: (filters: UniversalSearchFilters) => void;
  enabledEntities: SearchEntityType[];
  categories: any[];
  availableTags: string[];
  customAttributes: any[];
}

export interface SearchResultsProps {
  results: SearchResults;
  loading: boolean;
  onResultClick: (result: SearchResultItem) => void;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  viewMode: 'list' | 'grid' | 'table';
  onViewModeChange: (mode: 'list' | 'grid' | 'table') => void;
}

export interface SearchPresetsProps {
  presets: SearchFilterPreset[];
  currentFilters: UniversalSearchFilters;
  onPresetSelect: (preset: SearchFilterPreset) => void;
  onPresetSave: (name: string, description?: string) => void;
  onPresetDelete: (presetId: string) => void;
  onPresetUpdate: (presetId: string, updates: SearchFilterPresetUpdate) => void;
}

export interface CategoryTreeFilterProps {
  categories: any[];
  selectedCategories: string[];
  onCategorySelect: (categoryIds: string[]) => void;
  multiSelect?: boolean;
  showItemCounts?: boolean;
  expandedCategories?: Set<string>;
  onToggleExpanded?: (categoryId: string) => void;
}

export interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  showSuggestions?: boolean;
  allowCustomTags?: boolean;
  maxTags?: number;
}

export interface AttributeFilterProps {
  attributes: any[];
  selectedAttributes: Record<string, any>;
  onAttributesChange: (attributes: Record<string, any>) => void;
  showAdvancedOperators?: boolean;
}

// Error Types
export interface SearchError {
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
}

// Validation Types
export interface SearchValidationResult {
  isValid: boolean;
  errors: SearchError[];
  warnings: SearchError[];
}