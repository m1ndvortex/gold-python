"""
Universal Business Adaptability Schemas
Pydantic schemas for business type configuration, workflow adaptation, terminology mapping,
custom field schemas, feature configuration, unit management, pricing models, and reporting templates.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal
from enum import Enum

# Enums for business adaptability
class BusinessTypeCategory(str, Enum):
    RETAIL = "retail"
    SERVICE = "service"
    MANUFACTURING = "manufacturing"
    RESTAURANT = "restaurant"
    HEALTHCARE = "healthcare"
    AUTOMOTIVE = "automotive"
    EDUCATION = "education"
    REAL_ESTATE = "real_estate"
    OTHER = "other"

class FieldType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    ENUM = "enum"
    FILE = "file"
    EMAIL = "email"
    PHONE = "phone"
    URL = "url"
    CURRENCY = "currency"
    PERCENTAGE = "percentage"

class PricingModelType(str, Enum):
    FIXED = "fixed"
    WEIGHT_BASED = "weight_based"
    TIME_BASED = "time_based"
    FORMULA = "formula"
    TIERED = "tiered"
    MARKUP = "markup"
    MARGIN = "margin"
    DYNAMIC = "dynamic"

class WorkflowRuleType(str, Enum):
    INVENTORY = "inventory"
    INVOICE = "invoice"
    ACCOUNTING = "accounting"
    CUSTOMER = "customer"
    REPORTING = "reporting"
    NOTIFICATION = "notification"

# Business Type Schemas
class BusinessTypeBase(BaseModel):
    type_code: str = Field(..., description="Unique business type code")
    name: str = Field(..., description="Business type name")
    name_persian: Optional[str] = Field(None, description="Persian name")
    description: Optional[str] = Field(None, description="Business type description")
    icon: Optional[str] = Field(None, description="Icon name")
    color: str = Field(default='#3B82F6', description="Theme color")
    industry_category: Optional[BusinessTypeCategory] = Field(None, description="Industry category")
    default_configuration: Dict[str, Any] = Field(default_factory=dict, description="Default configuration")
    default_terminology: Dict[str, str] = Field(default_factory=dict, description="Default terminology mapping")
    default_workflow_config: Dict[str, Any] = Field(default_factory=dict, description="Default workflow configuration")
    default_feature_flags: Dict[str, bool] = Field(default_factory=dict, description="Default feature flags")
    default_units: List[Dict[str, Any]] = Field(default_factory=list, description="Default units of measure")
    default_pricing_models: List[Dict[str, Any]] = Field(default_factory=list, description="Default pricing models")
    regulatory_requirements: Dict[str, Any] = Field(default_factory=dict, description="Regulatory requirements")
    compliance_features: Dict[str, Any] = Field(default_factory=dict, description="Compliance features")

class BusinessTypeCreate(BusinessTypeBase):
    pass

class BusinessTypeUpdate(BaseModel):
    type_code: Optional[str] = None
    name: Optional[str] = None
    name_persian: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    industry_category: Optional[BusinessTypeCategory] = None
    default_configuration: Optional[Dict[str, Any]] = None
    default_terminology: Optional[Dict[str, str]] = None
    default_workflow_config: Optional[Dict[str, Any]] = None
    default_feature_flags: Optional[Dict[str, bool]] = None
    default_units: Optional[List[Dict[str, Any]]] = None
    default_pricing_models: Optional[List[Dict[str, Any]]] = None
    regulatory_requirements: Optional[Dict[str, Any]] = None
    compliance_features: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_template: Optional[bool] = None

class BusinessType(BusinessTypeBase):
    id: UUID
    is_active: bool
    is_template: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Enhanced Business Configuration Schemas
class EnhancedBusinessConfigurationBase(BaseModel):
    business_type_id: UUID = Field(..., description="Business type ID")
    business_name: str = Field(..., description="Business name")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Business configuration")
    terminology_mapping: Dict[str, str] = Field(default_factory=dict, description="Terminology mapping")
    workflow_config: Dict[str, Any] = Field(default_factory=dict, description="Workflow configuration")
    feature_flags: Dict[str, bool] = Field(default_factory=dict, description="Feature flags")
    units_of_measure: List[Dict[str, Any]] = Field(default_factory=list, description="Units of measure")
    pricing_models: List[Dict[str, Any]] = Field(default_factory=list, description="Pricing models")
    custom_field_schemas: Dict[str, Any] = Field(default_factory=dict, description="Custom field schemas")
    reporting_templates: Dict[str, Any] = Field(default_factory=dict, description="Reporting templates")
    default_language: str = Field(default='en', description="Default language")
    supported_languages: List[str] = Field(default=['en'], description="Supported languages")
    currency: str = Field(default='USD', description="Default currency")
    timezone: str = Field(default='UTC', description="Default timezone")
    date_format: str = Field(default='YYYY-MM-DD', description="Date format")
    number_format: Dict[str, Any] = Field(default_factory=dict, description="Number format settings")
    business_address: Optional[str] = Field(None, description="Business address")
    business_phone: Optional[str] = Field(None, description="Business phone")
    business_email: Optional[str] = Field(None, description="Business email")
    business_website: Optional[str] = Field(None, description="Business website")
    tax_id: Optional[str] = Field(None, description="Tax ID")
    registration_number: Optional[str] = Field(None, description="Registration number")
    operating_hours: Dict[str, Any] = Field(default_factory=dict, description="Operating hours")
    business_locations: List[Dict[str, Any]] = Field(default_factory=list, description="Business locations")
    departments: List[Dict[str, Any]] = Field(default_factory=list, description="Departments")

class EnhancedBusinessConfigurationCreate(EnhancedBusinessConfigurationBase):
    pass

class EnhancedBusinessConfigurationUpdate(BaseModel):
    business_type_id: Optional[UUID] = None
    business_name: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    terminology_mapping: Optional[Dict[str, str]] = None
    workflow_config: Optional[Dict[str, Any]] = None
    feature_flags: Optional[Dict[str, bool]] = None
    units_of_measure: Optional[List[Dict[str, Any]]] = None
    pricing_models: Optional[List[Dict[str, Any]]] = None
    custom_field_schemas: Optional[Dict[str, Any]] = None
    reporting_templates: Optional[Dict[str, Any]] = None
    default_language: Optional[str] = None
    supported_languages: Optional[List[str]] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    number_format: Optional[Dict[str, Any]] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    business_website: Optional[str] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    operating_hours: Optional[Dict[str, Any]] = None
    business_locations: Optional[List[Dict[str, Any]]] = None
    departments: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None
    setup_completed: Optional[bool] = None

class EnhancedBusinessConfiguration(EnhancedBusinessConfigurationBase):
    id: UUID
    migrated_from_type: Optional[str] = None
    migration_date: Optional[datetime] = None
    migration_notes: Optional[str] = None
    is_active: bool
    setup_completed: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Workflow Rule Schemas
class WorkflowRuleBase(BaseModel):
    rule_name: str = Field(..., description="Rule name")
    rule_type: WorkflowRuleType = Field(..., description="Rule type")
    entity_type: str = Field(..., description="Entity type")
    conditions: Dict[str, Any] = Field(..., description="Rule conditions")
    actions: Dict[str, Any] = Field(..., description="Rule actions")
    priority: int = Field(default=0, description="Rule priority")
    applies_to: Dict[str, Any] = Field(default_factory=dict, description="Entities this rule applies to")

class WorkflowRuleCreate(WorkflowRuleBase):
    business_configuration_id: UUID = Field(..., description="Business configuration ID")

class WorkflowRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[WorkflowRuleType] = None
    entity_type: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    actions: Optional[Dict[str, Any]] = None
    priority: Optional[int] = None
    applies_to: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class WorkflowRule(WorkflowRuleBase):
    id: UUID
    business_configuration_id: UUID
    is_active: bool
    execution_count: int
    last_executed: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Custom Field Definition Schemas
class CustomFieldDefinitionBase(BaseModel):
    field_name: str = Field(..., description="Field name")
    field_key: str = Field(..., description="Field key")
    entity_type: str = Field(..., description="Entity type")
    field_type: FieldType = Field(..., description="Field type")
    field_config: Dict[str, Any] = Field(default_factory=dict, description="Field configuration")
    validation_rules: Dict[str, Any] = Field(default_factory=dict, description="Validation rules")
    display_name: str = Field(..., description="Display name")
    display_name_persian: Optional[str] = Field(None, description="Persian display name")
    description: Optional[str] = Field(None, description="Field description")
    placeholder: Optional[str] = Field(None, description="Placeholder text")
    help_text: Optional[str] = Field(None, description="Help text")
    is_required: bool = Field(default=False, description="Is required")
    is_searchable: bool = Field(default=True, description="Is searchable")
    is_filterable: bool = Field(default=True, description="Is filterable")
    is_sortable: bool = Field(default=False, description="Is sortable")
    show_in_list: bool = Field(default=False, description="Show in list view")
    show_in_detail: bool = Field(default=True, description="Show in detail view")
    display_order: int = Field(default=0, description="Display order")
    field_group: Optional[str] = Field(None, description="Field group")
    column_span: int = Field(default=1, description="Column span")
    business_rules: Dict[str, Any] = Field(default_factory=dict, description="Business rules")
    conditional_logic: Dict[str, Any] = Field(default_factory=dict, description="Conditional logic")

class CustomFieldDefinitionCreate(CustomFieldDefinitionBase):
    business_configuration_id: UUID = Field(..., description="Business configuration ID")

class CustomFieldDefinitionUpdate(BaseModel):
    field_name: Optional[str] = None
    field_key: Optional[str] = None
    entity_type: Optional[str] = None
    field_type: Optional[FieldType] = None
    field_config: Optional[Dict[str, Any]] = None
    validation_rules: Optional[Dict[str, Any]] = None
    display_name: Optional[str] = None
    display_name_persian: Optional[str] = None
    description: Optional[str] = None
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    is_required: Optional[bool] = None
    is_searchable: Optional[bool] = None
    is_filterable: Optional[bool] = None
    is_sortable: Optional[bool] = None
    show_in_list: Optional[bool] = None
    show_in_detail: Optional[bool] = None
    display_order: Optional[int] = None
    field_group: Optional[str] = None
    column_span: Optional[int] = None
    business_rules: Optional[Dict[str, Any]] = None
    conditional_logic: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class CustomFieldDefinition(CustomFieldDefinitionBase):
    id: UUID
    business_configuration_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Unit of Measure Schemas
class UnitOfMeasureBase(BaseModel):
    unit_code: str = Field(..., description="Unit code")
    unit_name: str = Field(..., description="Unit name")
    unit_name_persian: Optional[str] = Field(None, description="Persian unit name")
    unit_symbol: Optional[str] = Field(None, description="Unit symbol")
    unit_type: str = Field(..., description="Unit type")
    base_unit: Optional[str] = Field(None, description="Base unit")
    conversion_factor: Decimal = Field(default=Decimal('1'), description="Conversion factor")
    decimal_places: int = Field(default=2, description="Decimal places")
    display_format: Optional[str] = Field(None, description="Display format")
    applicable_business_types: List[str] = Field(default_factory=list, description="Applicable business types")
    industry_standard: bool = Field(default=False, description="Industry standard")

class UnitOfMeasureCreate(UnitOfMeasureBase):
    business_configuration_id: Optional[UUID] = Field(None, description="Business configuration ID")

class UnitOfMeasureUpdate(BaseModel):
    unit_code: Optional[str] = None
    unit_name: Optional[str] = None
    unit_name_persian: Optional[str] = None
    unit_symbol: Optional[str] = None
    unit_type: Optional[str] = None
    base_unit: Optional[str] = None
    conversion_factor: Optional[Decimal] = None
    decimal_places: Optional[int] = None
    display_format: Optional[str] = None
    applicable_business_types: Optional[List[str]] = None
    industry_standard: Optional[bool] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class UnitOfMeasure(UnitOfMeasureBase):
    id: UUID
    business_configuration_id: Optional[UUID] = None
    usage_count: int
    last_used: Optional[datetime] = None
    is_active: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Pricing Rule Schemas
class PricingRuleBase(BaseModel):
    rule_name: str = Field(..., description="Rule name")
    rule_type: PricingModelType = Field(..., description="Rule type")
    applies_to: str = Field(..., description="Applies to")
    entity_ids: List[UUID] = Field(default_factory=list, description="Entity IDs")
    pricing_model: Dict[str, Any] = Field(..., description="Pricing model")
    formula: Optional[str] = Field(None, description="Pricing formula")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Parameters")
    conditions: Dict[str, Any] = Field(default_factory=dict, description="Conditions")
    date_range: Dict[str, Any] = Field(default_factory=dict, description="Date range")
    quantity_breaks: List[Dict[str, Any]] = Field(default_factory=list, description="Quantity breaks")
    priority: int = Field(default=0, description="Priority")

class PricingRuleCreate(PricingRuleBase):
    business_configuration_id: UUID = Field(..., description="Business configuration ID")

class PricingRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    rule_type: Optional[PricingModelType] = None
    applies_to: Optional[str] = None
    entity_ids: Optional[List[UUID]] = None
    pricing_model: Optional[Dict[str, Any]] = None
    formula: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    conditions: Optional[Dict[str, Any]] = None
    date_range: Optional[Dict[str, Any]] = None
    quantity_breaks: Optional[List[Dict[str, Any]]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class PricingRule(PricingRuleBase):
    id: UUID
    business_configuration_id: UUID
    is_active: bool
    usage_count: int
    last_used: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Report Template Schemas
class ReportTemplateBase(BaseModel):
    template_name: str = Field(..., description="Template name")
    template_code: str = Field(..., description="Template code")
    category: str = Field(..., description="Template category")
    template_config: Dict[str, Any] = Field(..., description="Template configuration")
    data_sources: List[Dict[str, Any]] = Field(..., description="Data sources")
    calculations: Dict[str, Any] = Field(default_factory=dict, description="Calculations")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Filters")
    layout: Dict[str, Any] = Field(default_factory=dict, description="Layout")
    styling: Dict[str, Any] = Field(default_factory=dict, description="Styling")
    export_formats: List[str] = Field(default=['pdf', 'excel'], description="Export formats")
    applicable_business_types: List[str] = Field(default_factory=list, description="Applicable business types")
    industry_standard: bool = Field(default=False, description="Industry standard")
    kpi_definitions: List[Dict[str, Any]] = Field(default_factory=list, description="KPI definitions")
    metric_calculations: Dict[str, Any] = Field(default_factory=dict, description="Metric calculations")

class ReportTemplateCreate(ReportTemplateBase):
    business_configuration_id: Optional[UUID] = Field(None, description="Business configuration ID")

class ReportTemplateUpdate(BaseModel):
    template_name: Optional[str] = None
    template_code: Optional[str] = None
    category: Optional[str] = None
    template_config: Optional[Dict[str, Any]] = None
    data_sources: Optional[List[Dict[str, Any]]] = None
    calculations: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None
    layout: Optional[Dict[str, Any]] = None
    styling: Optional[Dict[str, Any]] = None
    export_formats: Optional[List[str]] = None
    applicable_business_types: Optional[List[str]] = None
    industry_standard: Optional[bool] = None
    kpi_definitions: Optional[List[Dict[str, Any]]] = None
    metric_calculations: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class ReportTemplate(ReportTemplateBase):
    id: UUID
    business_configuration_id: Optional[UUID] = None
    usage_count: int
    last_generated: Optional[datetime] = None
    is_active: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Business Migration Schemas
class BusinessMigrationRequest(BaseModel):
    to_business_type_id: UUID = Field(..., description="Target business type ID")
    migration_reason: Optional[str] = Field(None, description="Migration reason")
    preserve_data: bool = Field(default=True, description="Preserve existing data")
    data_mapping: Dict[str, Any] = Field(default_factory=dict, description="Data mapping configuration")

class BusinessMigrationLogBase(BaseModel):
    from_business_type: str = Field(..., description="Source business type")
    to_business_type: str = Field(..., description="Target business type")
    migration_reason: Optional[str] = Field(None, description="Migration reason")
    migration_steps: List[Dict[str, Any]] = Field(..., description="Migration steps")
    data_mapping: Dict[str, Any] = Field(default_factory=dict, description="Data mapping")
    preserved_data: Dict[str, Any] = Field(default_factory=dict, description="Preserved data")

class BusinessMigrationLog(BusinessMigrationLogBase):
    id: UUID
    business_configuration_id: UUID
    status: str
    progress_percentage: int
    current_step: Optional[str] = None
    migrated_records: Dict[str, Any]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    rollback_data: Dict[str, Any]
    can_rollback: bool
    rollback_deadline: Optional[datetime] = None
    created_at: datetime
    created_by: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Feature Configuration Schemas
class FeatureConfigurationBase(BaseModel):
    feature_code: str = Field(..., description="Feature code")
    feature_name: str = Field(..., description="Feature name")
    feature_category: str = Field(..., description="Feature category")
    is_enabled: bool = Field(default=True, description="Is enabled")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Configuration")
    permissions: Dict[str, Any] = Field(default_factory=dict, description="Permissions")
    applicable_business_types: List[str] = Field(default_factory=list, description="Applicable business types")
    required_for_types: List[str] = Field(default_factory=list, description="Required for types")
    depends_on_features: List[str] = Field(default_factory=list, description="Dependencies")
    conflicts_with_features: List[str] = Field(default_factory=list, description="Conflicts")

class FeatureConfigurationCreate(FeatureConfigurationBase):
    business_configuration_id: Optional[UUID] = Field(None, description="Business configuration ID")

class FeatureConfigurationUpdate(BaseModel):
    feature_code: Optional[str] = None
    feature_name: Optional[str] = None
    feature_category: Optional[str] = None
    is_enabled: Optional[bool] = None
    configuration: Optional[Dict[str, Any]] = None
    permissions: Optional[Dict[str, Any]] = None
    applicable_business_types: Optional[List[str]] = None
    required_for_types: Optional[List[str]] = None
    depends_on_features: Optional[List[str]] = None
    conflicts_with_features: Optional[List[str]] = None
    is_active: Optional[bool] = None

class FeatureConfiguration(FeatureConfigurationBase):
    id: UUID
    business_configuration_id: Optional[UUID] = None
    usage_count: int
    last_used: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Response schemas for complex operations
class BusinessAdaptabilityStatus(BaseModel):
    business_configuration_id: UUID
    business_type: str
    setup_completed: bool
    active_features: List[str]
    configured_units: int
    pricing_rules: int
    custom_fields: int
    workflow_rules: int
    last_migration: Optional[datetime] = None
    
class BusinessTypeCompatibility(BaseModel):
    source_type: str
    target_type: str
    compatibility_score: float
    migration_complexity: str  # low, medium, high
    data_preservation: float
    required_changes: List[str]
    recommended_steps: List[str]