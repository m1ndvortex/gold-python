"""
Business Configuration Schemas

Pydantic schemas for business type configuration API requests and responses.
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from enum import Enum
import uuid

class BusinessTypeEnum(str, Enum):
    """Supported business types"""
    GOLD_SHOP = "gold_shop"
    RETAIL_STORE = "retail_store"
    RESTAURANT = "restaurant"
    SERVICE_BUSINESS = "service_business"
    MANUFACTURING = "manufacturing"
    WHOLESALE = "wholesale"
    PHARMACY = "pharmacy"
    AUTOMOTIVE = "automotive"
    GROCERY_STORE = "grocery_store"
    CLOTHING_STORE = "clothing_store"
    ELECTRONICS_STORE = "electronics_store"
    CUSTOM = "custom"

class WorkflowTypeEnum(str, Enum):
    """Workflow types"""
    INVOICE_WORKFLOW = "invoice_workflow"
    INVENTORY_WORKFLOW = "inventory_workflow"
    CUSTOMER_WORKFLOW = "customer_workflow"
    PAYMENT_WORKFLOW = "payment_workflow"
    REPORTING_WORKFLOW = "reporting_workflow"

class FieldTypeEnum(str, Enum):
    """Custom field types"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    DATETIME = "datetime"
    BOOLEAN = "boolean"
    ENUM = "enum"
    MULTI_SELECT = "multi_select"
    FILE = "file"
    IMAGE = "image"

# Base schemas
class BusinessTypeConfigurationBase(BaseModel):
    business_type: BusinessTypeEnum
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    industry: Optional[str] = None
    is_active: bool = True
    is_default: bool = False

class BusinessTypeConfigurationCreate(BusinessTypeConfigurationBase):
    pass

class BusinessTypeConfigurationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    industry: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class BusinessTypeConfigurationResponse(BusinessTypeConfigurationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Terminology Mapping schemas
class TerminologyMappingBase(BaseModel):
    standard_term: str = Field(..., min_length=1, max_length=100)
    business_term: str = Field(..., min_length=1, max_length=100)
    context: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    language_code: str = Field(default="en", max_length=10)

class TerminologyMappingCreate(TerminologyMappingBase):
    business_config_id: uuid.UUID

class TerminologyMappingUpdate(BaseModel):
    standard_term: Optional[str] = Field(None, min_length=1, max_length=100)
    business_term: Optional[str] = Field(None, min_length=1, max_length=100)
    context: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    language_code: Optional[str] = Field(None, max_length=10)

class TerminologyMappingResponse(TerminologyMappingBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Workflow Configuration schemas
class WorkflowStage(BaseModel):
    name: str
    order: int
    is_required: bool = True
    conditions: Optional[Dict[str, Any]] = None

class WorkflowRule(BaseModel):
    name: str
    condition: Dict[str, Any]
    action: Dict[str, Any]
    is_active: bool = True

class ApprovalRequirement(BaseModel):
    stage: str
    required_role: str
    is_required: bool = True
    conditions: Optional[Dict[str, Any]] = None

class NotificationSetting(BaseModel):
    event: str
    recipients: List[str]
    template: str
    is_active: bool = True

class WorkflowConfigurationBase(BaseModel):
    workflow_type: WorkflowTypeEnum
    workflow_name: str = Field(..., min_length=1, max_length=255)
    stages: List[WorkflowStage] = []
    rules: List[WorkflowRule] = []
    approvals: List[ApprovalRequirement] = []
    notifications: List[NotificationSetting] = []
    is_active: bool = True
    is_required: bool = False

class WorkflowConfigurationCreate(WorkflowConfigurationBase):
    business_config_id: uuid.UUID

class WorkflowConfigurationUpdate(BaseModel):
    workflow_name: Optional[str] = Field(None, min_length=1, max_length=255)
    stages: Optional[List[WorkflowStage]] = None
    rules: Optional[List[WorkflowRule]] = None
    approvals: Optional[List[ApprovalRequirement]] = None
    notifications: Optional[List[NotificationSetting]] = None
    is_active: Optional[bool] = None
    is_required: Optional[bool] = None

class WorkflowConfigurationResponse(WorkflowConfigurationBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Custom Field Schema schemas
class FieldValidationRule(BaseModel):
    rule_type: str  # e.g., "min_length", "max_length", "pattern", "range"
    value: Union[str, int, float, bool]
    message: Optional[str] = None

class CustomFieldSchemaBase(BaseModel):
    field_name: str = Field(..., min_length=1, max_length=100)
    field_label: str = Field(..., min_length=1, max_length=255)
    field_type: FieldTypeEnum
    entity_type: str = Field(..., min_length=1, max_length=50)
    field_options: Optional[List[Dict[str, Any]]] = None
    validation_rules: Optional[List[FieldValidationRule]] = None
    default_value: Optional[Any] = None
    is_required: bool = False
    is_searchable: bool = False
    is_filterable: bool = False
    is_active: bool = True
    display_order: int = 0
    display_group: Optional[str] = Field(None, max_length=100)

class CustomFieldSchemaCreate(CustomFieldSchemaBase):
    business_config_id: uuid.UUID

class CustomFieldSchemaUpdate(BaseModel):
    field_name: Optional[str] = Field(None, min_length=1, max_length=100)
    field_label: Optional[str] = Field(None, min_length=1, max_length=255)
    field_type: Optional[FieldTypeEnum] = None
    entity_type: Optional[str] = Field(None, min_length=1, max_length=50)
    field_options: Optional[List[Dict[str, Any]]] = None
    validation_rules: Optional[List[FieldValidationRule]] = None
    default_value: Optional[Any] = None
    is_required: Optional[bool] = None
    is_searchable: Optional[bool] = None
    is_filterable: Optional[bool] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    display_group: Optional[str] = Field(None, max_length=100)

class CustomFieldSchemaResponse(CustomFieldSchemaBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Feature Configuration schemas
class FeatureConfigurationBase(BaseModel):
    feature_name: str = Field(..., min_length=1, max_length=100)
    feature_category: Optional[str] = Field(None, max_length=50)
    is_enabled: bool = True
    configuration: Optional[Dict[str, Any]] = None
    required_roles: Optional[List[str]] = None

class FeatureConfigurationCreate(FeatureConfigurationBase):
    business_config_id: uuid.UUID

class FeatureConfigurationUpdate(BaseModel):
    feature_name: Optional[str] = Field(None, min_length=1, max_length=100)
    feature_category: Optional[str] = Field(None, max_length=50)
    is_enabled: Optional[bool] = None
    configuration: Optional[Dict[str, Any]] = None
    required_roles: Optional[List[str]] = None

class FeatureConfigurationResponse(FeatureConfigurationBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Report Template schemas
class ReportTemplateBase(BaseModel):
    template_name: str = Field(..., min_length=1, max_length=255)
    template_category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    report_type: Optional[str] = Field(None, max_length=50)
    template_config: Optional[Dict[str, Any]] = None
    chart_config: Optional[Dict[str, Any]] = None
    is_default: bool = False
    is_active: bool = True

class ReportTemplateCreate(ReportTemplateBase):
    business_config_id: uuid.UUID

class ReportTemplateUpdate(BaseModel):
    template_name: Optional[str] = Field(None, min_length=1, max_length=255)
    template_category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    report_type: Optional[str] = Field(None, max_length=50)
    template_config: Optional[Dict[str, Any]] = None
    chart_config: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class ReportTemplateResponse(ReportTemplateBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# KPI Definition schemas
class KPIDefinitionBase(BaseModel):
    kpi_name: str = Field(..., min_length=1, max_length=255)
    kpi_category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    calculation_method: Optional[str] = Field(None, max_length=100)
    calculation_config: Optional[Dict[str, Any]] = None
    display_format: Optional[str] = Field(None, max_length=50)
    target_value: Optional[Dict[str, Any]] = None
    is_default: bool = False
    is_active: bool = True

class KPIDefinitionCreate(KPIDefinitionBase):
    business_config_id: uuid.UUID

class KPIDefinitionUpdate(BaseModel):
    kpi_name: Optional[str] = Field(None, min_length=1, max_length=255)
    kpi_category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    calculation_method: Optional[str] = Field(None, max_length=100)
    calculation_config: Optional[Dict[str, Any]] = None
    display_format: Optional[str] = Field(None, max_length=50)
    target_value: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class KPIDefinitionResponse(KPIDefinitionBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Service Catalog schemas
class ServiceCatalogBase(BaseModel):
    service_name: str = Field(..., min_length=1, max_length=255)
    service_code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    base_price: Optional[str] = Field(None, max_length=20)
    currency: str = Field(default="USD", max_length=3)
    estimated_duration: Optional[int] = None  # Duration in minutes
    requires_booking: bool = False
    is_time_tracked: bool = False
    billing_method: Optional[str] = Field(None, max_length=50)
    is_active: bool = True

class ServiceCatalogCreate(ServiceCatalogBase):
    business_config_id: uuid.UUID

class ServiceCatalogUpdate(BaseModel):
    service_name: Optional[str] = Field(None, min_length=1, max_length=255)
    service_code: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    base_price: Optional[str] = Field(None, max_length=20)
    currency: Optional[str] = Field(None, max_length=3)
    estimated_duration: Optional[int] = None
    requires_booking: Optional[bool] = None
    is_time_tracked: Optional[bool] = None
    billing_method: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None

class ServiceCatalogResponse(ServiceCatalogBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Bill of Materials schemas
class BOMComponent(BaseModel):
    component_id: uuid.UUID
    component_name: str
    quantity: float
    unit: str
    cost_per_unit: Optional[float] = None

class ProductionStep(BaseModel):
    step_name: str
    order: int
    description: Optional[str] = None
    estimated_time: Optional[int] = None  # Time in minutes
    required_skills: Optional[List[str]] = None

class BillOfMaterialsBase(BaseModel):
    bom_name: str = Field(..., min_length=1, max_length=255)
    bom_code: Optional[str] = Field(None, max_length=50)
    product_id: Optional[uuid.UUID] = None
    version: str = Field(default="1.0", max_length=20)
    components: List[BOMComponent] = []
    production_steps: List[ProductionStep] = []
    material_cost: Optional[str] = Field(None, max_length=20)
    labor_cost: Optional[str] = Field(None, max_length=20)
    overhead_cost: Optional[str] = Field(None, max_length=20)
    total_cost: Optional[str] = Field(None, max_length=20)
    is_active: bool = True

class BillOfMaterialsCreate(BillOfMaterialsBase):
    business_config_id: uuid.UUID

class BillOfMaterialsUpdate(BaseModel):
    bom_name: Optional[str] = Field(None, min_length=1, max_length=255)
    bom_code: Optional[str] = Field(None, max_length=50)
    product_id: Optional[uuid.UUID] = None
    version: Optional[str] = Field(None, max_length=20)
    components: Optional[List[BOMComponent]] = None
    production_steps: Optional[List[ProductionStep]] = None
    material_cost: Optional[str] = Field(None, max_length=20)
    labor_cost: Optional[str] = Field(None, max_length=20)
    overhead_cost: Optional[str] = Field(None, max_length=20)
    total_cost: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None

class BillOfMaterialsResponse(BillOfMaterialsBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Production Tracking schemas
class ProductionStepTracking(BaseModel):
    step_name: str
    status: str  # "pending", "in_progress", "completed", "skipped"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None

class QualityCheck(BaseModel):
    check_name: str
    result: str  # "pass", "fail", "pending"
    checked_by: Optional[str] = None
    check_time: Optional[datetime] = None
    notes: Optional[str] = None

class ProductionTrackingBase(BaseModel):
    production_order: str = Field(..., min_length=1, max_length=100)
    bom_id: Optional[uuid.UUID] = None
    product_id: Optional[uuid.UUID] = None
    planned_quantity: int = Field(..., gt=0)
    produced_quantity: int = Field(default=0, ge=0)
    rejected_quantity: int = Field(default=0, ge=0)
    status: str = Field(default="planned", max_length=50)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    production_steps: List[ProductionStepTracking] = []
    quality_checks: List[QualityCheck] = []

class ProductionTrackingCreate(ProductionTrackingBase):
    business_config_id: uuid.UUID

class ProductionTrackingUpdate(BaseModel):
    production_order: Optional[str] = Field(None, min_length=1, max_length=100)
    bom_id: Optional[uuid.UUID] = None
    product_id: Optional[uuid.UUID] = None
    planned_quantity: Optional[int] = Field(None, gt=0)
    produced_quantity: Optional[int] = Field(None, ge=0)
    rejected_quantity: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=50)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    production_steps: Optional[List[ProductionStepTracking]] = None
    quality_checks: Optional[List[QualityCheck]] = None

class ProductionTrackingResponse(ProductionTrackingBase):
    id: uuid.UUID
    business_config_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Comprehensive business configuration response
class ComprehensiveBusinessConfigResponse(BusinessTypeConfigurationResponse):
    terminology_mappings: List[TerminologyMappingResponse] = []
    workflow_configurations: List[WorkflowConfigurationResponse] = []
    custom_field_schemas: List[CustomFieldSchemaResponse] = []
    feature_configurations: List[FeatureConfigurationResponse] = []
    report_templates: List[ReportTemplateResponse] = []
    kpi_definitions: List[KPIDefinitionResponse] = []

# Business type detection and setup
class BusinessTypeDetectionRequest(BaseModel):
    business_description: str = Field(..., min_length=10)
    industry: Optional[str] = None
    primary_activities: List[str] = []
    customer_types: List[str] = []

class BusinessTypeDetectionResponse(BaseModel):
    suggested_business_type: BusinessTypeEnum
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str
    alternative_suggestions: List[Dict[str, Any]] = []

class BusinessSetupWizardRequest(BaseModel):
    business_type: BusinessTypeEnum
    business_name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = None
    features_to_enable: List[str] = []
    custom_terminology: Optional[Dict[str, str]] = None
    initial_workflows: Optional[List[str]] = None