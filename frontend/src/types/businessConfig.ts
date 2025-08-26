/**
 * Business Configuration Types
 * 
 * TypeScript types for business type configuration management,
 * including business types, terminology mappings, workflows,
 * custom fields, and industry-specific configurations.
 */

export enum BusinessType {
  GOLD_SHOP = 'gold_shop',
  RETAIL_STORE = 'retail_store',
  RESTAURANT = 'restaurant',
  SERVICE_BUSINESS = 'service_business',
  MANUFACTURING = 'manufacturing',
  WHOLESALE = 'wholesale',
  PHARMACY = 'pharmacy',
  AUTOMOTIVE = 'automotive',
  GROCERY_STORE = 'grocery_store',
  CLOTHING_STORE = 'clothing_store',
  ELECTRONICS_STORE = 'electronics_store',
  CUSTOM = 'custom'
}

export enum WorkflowType {
  INVOICE_WORKFLOW = 'invoice_workflow',
  INVENTORY_WORKFLOW = 'inventory_workflow',
  CUSTOMER_WORKFLOW = 'customer_workflow',
  PAYMENT_WORKFLOW = 'payment_workflow',
  REPORTING_WORKFLOW = 'reporting_workflow'
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
  MULTI_SELECT = 'multi_select',
  FILE = 'file',
  IMAGE = 'image'
}

// Base interfaces
export interface BusinessTypeConfiguration {
  id: string;
  business_type: BusinessType;
  name: string;
  description?: string;
  industry?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TerminologyMapping {
  id: string;
  business_config_id: string;
  standard_term: string;
  business_term: string;
  context?: string;
  category?: string;
  language_code: string;
  created_at: string;
  updated_at?: string;
}

export interface WorkflowStage {
  name: string;
  order: number;
  is_required: boolean;
  conditions?: Record<string, any>;
}

export interface WorkflowRule {
  name: string;
  condition: Record<string, any>;
  action: Record<string, any>;
  is_active: boolean;
}

export interface ApprovalRequirement {
  stage: string;
  required_role: string;
  is_required: boolean;
  conditions?: Record<string, any>;
}

export interface NotificationSetting {
  event: string;
  recipients: string[];
  template: string;
  is_active: boolean;
}

export interface WorkflowConfiguration {
  id: string;
  business_config_id: string;
  workflow_type: WorkflowType;
  workflow_name: string;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  approvals: ApprovalRequirement[];
  notifications: NotificationSetting[];
  is_active: boolean;
  is_required: boolean;
  created_at: string;
  updated_at?: string;
}

export interface FieldValidationRule {
  rule_type: string;
  value: string | number | boolean;
  message?: string;
}

export interface CustomFieldSchema {
  id: string;
  business_config_id: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  entity_type: string;
  field_options?: Array<Record<string, any>>;
  validation_rules?: FieldValidationRule[];
  default_value?: any;
  is_required: boolean;
  is_searchable: boolean;
  is_filterable: boolean;
  is_active: boolean;
  display_order: number;
  display_group?: string;
  created_at: string;
  updated_at?: string;
}

export interface FeatureConfiguration {
  id: string;
  business_config_id: string;
  feature_name: string;
  feature_category?: string;
  is_enabled: boolean;
  configuration?: Record<string, any>;
  required_roles?: string[];
  created_at: string;
  updated_at?: string;
}

export interface ReportTemplate {
  id: string;
  business_config_id: string;
  template_name: string;
  template_category?: string;
  description?: string;
  report_type?: string;
  template_config?: Record<string, any>;
  chart_config?: Record<string, any>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface KPIDefinition {
  id: string;
  business_config_id: string;
  kpi_name: string;
  kpi_category?: string;
  description?: string;
  calculation_method?: string;
  calculation_config?: Record<string, any>;
  display_format?: string;
  target_value?: Record<string, any>;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ServiceCatalogItem {
  id: string;
  business_config_id: string;
  service_name: string;
  service_code?: string;
  description?: string;
  category?: string;
  base_price?: string;
  currency: string;
  estimated_duration?: number;
  requires_booking: boolean;
  is_time_tracked: boolean;
  billing_method?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BOMComponent {
  component_id: string;
  component_name: string;
  quantity: number;
  unit: string;
  cost_per_unit?: number;
}

export interface ProductionStep {
  step_name: string;
  order: number;
  description?: string;
  estimated_time?: number;
  required_skills?: string[];
}

export interface BillOfMaterials {
  id: string;
  business_config_id: string;
  bom_name: string;
  bom_code?: string;
  product_id?: string;
  version: string;
  components: BOMComponent[];
  production_steps: ProductionStep[];
  material_cost?: string;
  labor_cost?: string;
  overhead_cost?: string;
  total_cost?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductionStepTracking {
  step_name: string;
  status: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface QualityCheck {
  check_name: string;
  result: string;
  checked_by?: string;
  check_time?: string;
  notes?: string;
}

export interface ProductionTracking {
  id: string;
  business_config_id: string;
  production_order: string;
  bom_id?: string;
  product_id?: string;
  planned_quantity: number;
  produced_quantity: number;
  rejected_quantity: number;
  status: string;
  start_date?: string;
  end_date?: string;
  production_steps: ProductionStepTracking[];
  quality_checks: QualityCheck[];
  created_at: string;
  updated_at?: string;
}

// Comprehensive configuration response
export interface ComprehensiveBusinessConfig extends BusinessTypeConfiguration {
  terminology_mappings: TerminologyMapping[];
  workflow_configurations: WorkflowConfiguration[];
  custom_field_schemas: CustomFieldSchema[];
  feature_configurations: FeatureConfiguration[];
  report_templates: ReportTemplate[];
  kpi_definitions: KPIDefinition[];
}

// Business type detection and setup
export interface BusinessTypeDetectionRequest {
  business_description: string;
  industry?: string;
  primary_activities: string[];
  customer_types: string[];
}

export interface BusinessTypeDetectionResponse {
  suggested_business_type: BusinessType;
  confidence_score: number;
  reasoning: string;
  alternative_suggestions: Array<{
    business_type: BusinessType;
    confidence_score: number;
    reasoning: string;
  }>;
}

export interface BusinessSetupWizardRequest {
  business_type: BusinessType;
  business_name: string;
  industry?: string;
  features_to_enable: string[];
  custom_terminology?: Record<string, string>;
  initial_workflows?: string[];
}

// Create/Update request types
export interface BusinessTypeConfigurationCreate {
  business_type: BusinessType;
  name: string;
  description?: string;
  industry?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface BusinessTypeConfigurationUpdate {
  name?: string;
  description?: string;
  industry?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface TerminologyMappingCreate {
  business_config_id: string;
  standard_term: string;
  business_term: string;
  context?: string;
  category?: string;
  language_code?: string;
}

export interface WorkflowConfigurationCreate {
  business_config_id: string;
  workflow_type: WorkflowType;
  workflow_name: string;
  stages?: WorkflowStage[];
  rules?: WorkflowRule[];
  approvals?: ApprovalRequirement[];
  notifications?: NotificationSetting[];
  is_active?: boolean;
  is_required?: boolean;
}

export interface CustomFieldSchemaCreate {
  business_config_id: string;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  entity_type: string;
  field_options?: Array<Record<string, any>>;
  validation_rules?: FieldValidationRule[];
  default_value?: any;
  is_required?: boolean;
  is_searchable?: boolean;
  is_filterable?: boolean;
  is_active?: boolean;
  display_order?: number;
  display_group?: string;
}

export interface FeatureConfigurationCreate {
  business_config_id: string;
  feature_name: string;
  feature_category?: string;
  is_enabled?: boolean;
  configuration?: Record<string, any>;
  required_roles?: string[];
}

// Utility types
export interface BusinessTypeOption {
  value: BusinessType;
  label: string;
  description?: string;
  icon?: string;
}

export interface WorkflowTypeOption {
  value: WorkflowType;
  label: string;
  description?: string;
}

export interface FieldTypeOption {
  value: FieldType;
  label: string;
  description?: string;
  supportedValidations?: string[];
}

// Form state types
export interface BusinessConfigFormState {
  businessType: BusinessType | null;
  businessName: string;
  industry: string;
  description: string;
  selectedFeatures: string[];
  customTerminology: Record<string, string>;
  workflows: WorkflowConfiguration[];
  customFields: CustomFieldSchema[];
}

export interface CustomFieldFormState {
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldType;
  entityType: string;
  isRequired: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  displayOrder: number;
  displayGroup: string;
  fieldOptions: Array<{ label: string; value: string }>;
  validationRules: FieldValidationRule[];
  defaultValue: any;
}

export interface WorkflowFormState {
  workflowName: string;
  workflowType: WorkflowType;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  approvals: ApprovalRequirement[];
  notifications: NotificationSetting[];
  isActive: boolean;
  isRequired: boolean;
}

// API response types
export interface BusinessConfigApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface BusinessConfigListResponse {
  configurations: BusinessTypeConfiguration[];
  total: number;
  page: number;
  limit: number;
}

// Error types
export interface BusinessConfigError {
  field?: string;
  message: string;
  code?: string;
}

export interface BusinessConfigValidationError {
  errors: BusinessConfigError[];
  message: string;
}