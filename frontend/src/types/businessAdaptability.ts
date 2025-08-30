/**
 * Business Adaptability Types
 * TypeScript interfaces for business type configuration, workflow adaptation,
 * terminology mapping, custom field schemas, feature configuration, and more.
 */

export interface BusinessType {
  id: string;
  type_code: string;
  name: string;
  name_persian?: string;
  description?: string;
  icon?: string;
  color: string;
  industry_category?: BusinessTypeCategory;
  default_configuration: Record<string, any>;
  default_terminology: Record<string, string>;
  default_workflow_config: Record<string, any>;
  default_feature_flags: Record<string, boolean>;
  default_units: UnitOfMeasure[];
  default_pricing_models: PricingModel[];
  regulatory_requirements: Record<string, any>;
  compliance_features: Record<string, any>;
  is_active: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BusinessConfiguration {
  id: string;
  business_type_id: string;
  business_name: string;
  configuration: Record<string, any>;
  terminology_mapping: Record<string, string>;
  workflow_config: Record<string, any>;
  feature_flags: Record<string, boolean>;
  units_of_measure: UnitOfMeasure[];
  pricing_models: PricingModel[];
  custom_field_schemas: Record<string, any>;
  reporting_templates: Record<string, any>;
  default_language: string;
  supported_languages: string[];
  currency: string;
  timezone: string;
  date_format: string;
  number_format: Record<string, any>;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  tax_id?: string;
  registration_number?: string;
  operating_hours: Record<string, any>;
  business_locations: BusinessLocation[];
  departments: Department[];
  migrated_from_type?: string;
  migration_date?: string;
  migration_notes?: string;
  is_active: boolean;
  setup_completed: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  business_type?: BusinessType;
}

export interface WorkflowRule {
  id: string;
  business_configuration_id: string;
  rule_name: string;
  rule_type: WorkflowRuleType;
  entity_type: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority: number;
  applies_to: Record<string, any>;
  is_active: boolean;
  execution_count: number;
  last_executed?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomFieldDefinition {
  id: string;
  business_configuration_id: string;
  field_name: string;
  field_key: string;
  entity_type: string;
  field_type: FieldType;
  field_config: Record<string, any>;
  validation_rules: Record<string, any>;
  display_name: string;
  display_name_persian?: string;
  description?: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_sortable: boolean;
  show_in_list: boolean;
  show_in_detail: boolean;
  display_order: number;
  field_group?: string;
  column_span: number;
  business_rules: Record<string, any>;
  conditional_logic: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface UnitOfMeasure {
  id: string;
  business_configuration_id?: string;
  unit_code: string;
  unit_name: string;
  unit_name_persian?: string;
  unit_symbol?: string;
  unit_type: string;
  base_unit?: string;
  conversion_factor: number;
  decimal_places: number;
  display_format?: string;
  applicable_business_types: string[];
  industry_standard: boolean;
  usage_count: number;
  last_used?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  business_configuration_id: string;
  rule_name: string;
  rule_type: PricingModelType;
  applies_to: string;
  entity_ids: string[];
  pricing_model: Record<string, any>;
  formula?: string;
  parameters: Record<string, any>;
  conditions: Record<string, any>;
  date_range: Record<string, any>;
  quantity_breaks: QuantityBreak[];
  priority: number;
  is_active: boolean;
  usage_count: number;
  last_used?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BusinessMigrationLog {
  id: string;
  business_configuration_id: string;
  from_business_type: string;
  to_business_type: string;
  migration_reason?: string;
  migration_steps: MigrationStep[];
  data_mapping: Record<string, any>;
  preserved_data: Record<string, any>;
  status: MigrationStatus;
  progress_percentage: number;
  current_step?: string;
  migrated_records: Record<string, any>;
  errors: MigrationError[];
  warnings: MigrationWarning[];
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  rollback_data: Record<string, any>;
  can_rollback: boolean;
  rollback_deadline?: string;
  created_at: string;
  created_by?: string;
}

export interface FeatureConfiguration {
  id: string;
  business_configuration_id?: string;
  feature_code: string;
  feature_name: string;
  feature_category: string;
  is_enabled: boolean;
  configuration: Record<string, any>;
  permissions: Record<string, any>;
  applicable_business_types: string[];
  required_for_types: string[];
  depends_on_features: string[];
  conflicts_with_features: string[];
  usage_count: number;
  last_used?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessAdaptabilityStatus {
  business_configuration_id: string;
  business_type: string;
  setup_completed: boolean;
  active_features: string[];
  configured_units: number;
  pricing_rules: number;
  custom_fields: number;
  workflow_rules: number;
  last_migration?: string;
}

export interface BusinessTypeCompatibility {
  source_type: string;
  target_type: string;
  compatibility_score: number;
  migration_complexity: MigrationComplexity;
  data_preservation: number;
  required_changes: string[];
  recommended_steps: string[];
}

// Enums and supporting types
export enum BusinessTypeCategory {
  RETAIL = 'retail',
  SERVICE = 'service',
  MANUFACTURING = 'manufacturing',
  RESTAURANT = 'restaurant',
  HEALTHCARE = 'healthcare',
  AUTOMOTIVE = 'automotive',
  EDUCATION = 'education',
  REAL_ESTATE = 'real_estate',
  OTHER = 'other'
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
  FILE = 'file',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage'
}

export enum PricingModelType {
  FIXED = 'fixed',
  WEIGHT_BASED = 'weight_based',
  TIME_BASED = 'time_based',
  FORMULA = 'formula',
  TIERED = 'tiered',
  MARKUP = 'markup',
  MARGIN = 'margin',
  DYNAMIC = 'dynamic'
}

export enum WorkflowRuleType {
  INVENTORY = 'inventory',
  INVOICE = 'invoice',
  ACCOUNTING = 'accounting',
  CUSTOMER = 'customer',
  REPORTING = 'reporting',
  NOTIFICATION = 'notification'
}

export enum MigrationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

export enum MigrationComplexity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Supporting interfaces
export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager?: string;
  is_active: boolean;
}

export interface PricingModel {
  id: string;
  name: string;
  type: PricingModelType;
  configuration: Record<string, any>;
  is_default: boolean;
}

export interface QuantityBreak {
  min_quantity: number;
  max_quantity?: number;
  price_adjustment: number;
  adjustment_type: 'percentage' | 'fixed';
}

export interface MigrationStep {
  step_name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface MigrationError {
  step: string;
  error_code: string;
  error_message: string;
  timestamp: string;
}

export interface MigrationWarning {
  step: string;
  warning_code: string;
  warning_message: string;
  timestamp: string;
}

// Request/Response types for API calls
export interface BusinessTypeCreateRequest {
  type_code: string;
  name: string;
  name_persian?: string;
  description?: string;
  icon?: string;
  color?: string;
  industry_category?: BusinessTypeCategory;
  default_configuration?: Record<string, any>;
  default_terminology?: Record<string, string>;
  default_workflow_config?: Record<string, any>;
  default_feature_flags?: Record<string, boolean>;
  default_units?: UnitOfMeasure[];
  default_pricing_models?: PricingModel[];
  regulatory_requirements?: Record<string, any>;
  compliance_features?: Record<string, any>;
}

export interface BusinessConfigurationCreateRequest {
  business_type_id: string;
  business_name: string;
  configuration?: Record<string, any>;
  terminology_mapping?: Record<string, string>;
  workflow_config?: Record<string, any>;
  feature_flags?: Record<string, boolean>;
  units_of_measure?: UnitOfMeasure[];
  pricing_models?: PricingModel[];
  custom_field_schemas?: Record<string, any>;
  reporting_templates?: Record<string, any>;
  default_language?: string;
  supported_languages?: string[];
  currency?: string;
  timezone?: string;
  date_format?: string;
  number_format?: Record<string, any>;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  tax_id?: string;
  registration_number?: string;
  operating_hours?: Record<string, any>;
  business_locations?: BusinessLocation[];
  departments?: Department[];
}

export interface BusinessMigrationRequest {
  to_business_type_id: string;
  migration_reason?: string;
  preserve_data?: boolean;
  data_mapping?: Record<string, any>;
}

export interface TerminologyUpdateRequest {
  [key: string]: string;
}

export interface UnitConversionRequest {
  value: number;
  from_unit: string;
  to_unit: string;
  business_config_id?: string;
}

export interface UnitConversionResponse {
  original_value: number;
  from_unit: string;
  to_unit: string;
  converted_value: number;
}

export interface PriceCalculationRequest {
  entity_type: string;
  entity_id: string;
  base_price: number;
  quantity?: number;
  context?: Record<string, any>;
}

export interface PriceCalculationResponse {
  base_price: number;
  calculated_price: number;
  applied_rules: string[];
  calculation_details: Record<string, any>;
}

// UI-specific types
export interface BusinessTypeCard {
  businessType: BusinessType;
  isSelected: boolean;
  isRecommended: boolean;
  compatibilityScore?: number;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isCompleted: boolean;
  isActive: boolean;
  isOptional: boolean;
  dependencies: string[];
}

export interface FeatureToggle {
  feature: FeatureConfiguration;
  isEnabled: boolean;
  hasConflicts: boolean;
  missingDependencies: string[];
  affectedFeatures: string[];
}

export interface CustomFieldFormData {
  field_name: string;
  field_key: string;
  entity_type: string;
  field_type: FieldType;
  field_config: Record<string, any>;
  validation_rules: Record<string, any>;
  display_name: string;
  display_name_persian?: string;
  description?: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_sortable: boolean;
  show_in_list: boolean;
  show_in_detail: boolean;
  display_order: number;
  field_group?: string;
  column_span: number;
  business_rules: Record<string, any>;
  conditional_logic: Record<string, any>;
}

export interface WorkflowRuleFormData {
  rule_name: string;
  rule_type: WorkflowRuleType;
  entity_type: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority: number;
  applies_to: Record<string, any>;
}

export interface PricingRuleFormData {
  rule_name: string;
  rule_type: PricingModelType;
  applies_to: string;
  entity_ids: string[];
  pricing_model: Record<string, any>;
  formula?: string;
  parameters: Record<string, any>;
  conditions: Record<string, any>;
  date_range: Record<string, any>;
  quantity_breaks: QuantityBreak[];
  priority: number;
}

export interface BusinessAnalyticsData {
  kpis: KPIMetric[];
  metrics: BusinessMetric[];
  trends: TrendData[];
  comparisons: ComparisonData[];
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  change_period: string;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  category: string;
}

export interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  formatted_value: string;
  description: string;
  category: string;
  last_updated: string;
}

export interface TrendData {
  period: string;
  value: number;
  label: string;
}

export interface ComparisonData {
  category: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
}