"""
Business Configuration Router

FastAPI router for business type configuration management endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from database import get_db
from services.business_config_service import BusinessConfigurationService
from schemas_business_config import (
    BusinessTypeConfigurationCreate, BusinessTypeConfigurationUpdate, BusinessTypeConfigurationResponse,
    ComprehensiveBusinessConfigResponse,
    TerminologyMappingCreate, TerminologyMappingUpdate, TerminologyMappingResponse,
    WorkflowConfigurationCreate, WorkflowConfigurationUpdate, WorkflowConfigurationResponse,
    CustomFieldSchemaCreate, CustomFieldSchemaUpdate, CustomFieldSchemaResponse,
    FeatureConfigurationCreate, FeatureConfigurationUpdate, FeatureConfigurationResponse,
    ReportTemplateCreate, ReportTemplateUpdate, ReportTemplateResponse,
    KPIDefinitionCreate, KPIDefinitionUpdate, KPIDefinitionResponse,
    ServiceCatalogCreate, ServiceCatalogUpdate, ServiceCatalogResponse,
    BillOfMaterialsCreate, BillOfMaterialsUpdate, BillOfMaterialsResponse,
    ProductionTrackingCreate, ProductionTrackingUpdate, ProductionTrackingResponse,
    BusinessTypeDetectionRequest, BusinessTypeDetectionResponse,
    BusinessSetupWizardRequest,
    BusinessTypeEnum, WorkflowTypeEnum, FieldTypeEnum
)

router = APIRouter(prefix="/api/business-config", tags=["Business Configuration"])

def get_business_config_service(db: Session = Depends(get_db)) -> BusinessConfigurationService:
    """Dependency to get business configuration service"""
    return BusinessConfigurationService(db)

# Business Type Configuration endpoints
@router.post("/configurations", response_model=BusinessTypeConfigurationResponse)
async def create_business_configuration(
    config_data: BusinessTypeConfigurationCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create a new business type configuration"""
    try:
        return service.create_business_configuration(config_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/configurations", response_model=List[BusinessTypeConfigurationResponse])
async def list_business_configurations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """List all business type configurations"""
    return service.list_business_configurations(skip=skip, limit=limit)

@router.get("/configurations/{config_id}", response_model=ComprehensiveBusinessConfigResponse)
async def get_business_configuration(
    config_id: uuid.UUID,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get business configuration by ID with all related data"""
    config = service.get_business_configuration(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Business configuration not found")
    return config

@router.get("/configurations/by-type/{business_type}", response_model=ComprehensiveBusinessConfigResponse)
async def get_business_configuration_by_type(
    business_type: BusinessTypeEnum,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get business configuration by business type"""
    config = service.get_business_configuration_by_type(business_type)
    if not config:
        raise HTTPException(status_code=404, detail=f"Business configuration for {business_type} not found")
    return config

@router.put("/configurations/{config_id}", response_model=BusinessTypeConfigurationResponse)
async def update_business_configuration(
    config_id: uuid.UUID,
    update_data: BusinessTypeConfigurationUpdate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Update business configuration"""
    config = service.update_business_configuration(config_id, update_data)
    if not config:
        raise HTTPException(status_code=404, detail="Business configuration not found")
    return config

@router.delete("/configurations/{config_id}")
async def delete_business_configuration(
    config_id: uuid.UUID,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Delete business configuration"""
    success = service.delete_business_configuration(config_id)
    if not success:
        raise HTTPException(status_code=404, detail="Business configuration not found")
    return {"message": "Business configuration deleted successfully"}

# Terminology Mapping endpoints
@router.post("/terminology", response_model=TerminologyMappingResponse)
async def create_terminology_mapping(
    mapping_data: TerminologyMappingCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create terminology mapping"""
    return service.create_terminology_mapping(mapping_data)

@router.get("/terminology/{business_config_id}", response_model=List[TerminologyMappingResponse])
async def get_terminology_mappings(
    business_config_id: uuid.UUID,
    language_code: str = Query("en", description="Language code for terminology"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get terminology mappings for a business configuration"""
    return service.get_terminology_mappings(business_config_id, language_code)

@router.put("/terminology/{mapping_id}", response_model=TerminologyMappingResponse)
async def update_terminology_mapping(
    mapping_id: uuid.UUID,
    update_data: TerminologyMappingUpdate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Update terminology mapping"""
    mapping = service.update_terminology_mapping(mapping_id, update_data)
    if not mapping:
        raise HTTPException(status_code=404, detail="Terminology mapping not found")
    return mapping

# Workflow Configuration endpoints
@router.post("/workflows", response_model=WorkflowConfigurationResponse)
async def create_workflow_configuration(
    workflow_data: WorkflowConfigurationCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create workflow configuration"""
    return service.create_workflow_configuration(workflow_data)

@router.get("/workflows/{business_config_id}", response_model=List[WorkflowConfigurationResponse])
async def get_workflow_configurations(
    business_config_id: uuid.UUID,
    workflow_type: Optional[WorkflowTypeEnum] = Query(None, description="Filter by workflow type"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get workflow configurations for a business configuration"""
    return service.get_workflow_configurations(business_config_id, workflow_type)

# Custom Field Schema endpoints
@router.post("/custom-fields", response_model=CustomFieldSchemaResponse)
async def create_custom_field_schema(
    field_data: CustomFieldSchemaCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create custom field schema"""
    return service.create_custom_field_schema(field_data)

@router.get("/custom-fields/{business_config_id}", response_model=List[CustomFieldSchemaResponse])
async def get_custom_field_schemas(
    business_config_id: uuid.UUID,
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get custom field schemas for a business configuration"""
    return service.get_custom_field_schemas(business_config_id, entity_type)

# Feature Configuration endpoints
@router.post("/features", response_model=FeatureConfigurationResponse)
async def create_feature_configuration(
    feature_data: FeatureConfigurationCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create feature configuration"""
    return service.create_feature_configuration(feature_data)

@router.get("/features/{business_config_id}", response_model=List[FeatureConfigurationResponse])
async def get_feature_configurations(
    business_config_id: uuid.UUID,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get feature configurations for a business configuration"""
    return service.get_feature_configurations(business_config_id)

@router.get("/features/{business_config_id}/{feature_name}/enabled")
async def is_feature_enabled(
    business_config_id: uuid.UUID,
    feature_name: str,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Check if a feature is enabled for a business configuration"""
    is_enabled = service.is_feature_enabled(business_config_id, feature_name)
    return {"feature_name": feature_name, "is_enabled": is_enabled}

# Report Template endpoints
@router.post("/report-templates", response_model=ReportTemplateResponse)
async def create_report_template(
    template_data: ReportTemplateCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create report template"""
    return service.create_report_template(template_data)

@router.get("/report-templates/{business_config_id}", response_model=List[ReportTemplateResponse])
async def get_report_templates(
    business_config_id: uuid.UUID,
    report_type: Optional[str] = Query(None, description="Filter by report type"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get report templates for a business configuration"""
    return service.get_report_templates(business_config_id, report_type)

# KPI Definition endpoints
@router.post("/kpis", response_model=KPIDefinitionResponse)
async def create_kpi_definition(
    kpi_data: KPIDefinitionCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create KPI definition"""
    return service.create_kpi_definition(kpi_data)

@router.get("/kpis/{business_config_id}", response_model=List[KPIDefinitionResponse])
async def get_kpi_definitions(
    business_config_id: uuid.UUID,
    kpi_category: Optional[str] = Query(None, description="Filter by KPI category"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get KPI definitions for a business configuration"""
    return service.get_kpi_definitions(business_config_id, kpi_category)

# Service Catalog endpoints (for service businesses)
@router.post("/service-catalog", response_model=ServiceCatalogResponse)
async def create_service_catalog_item(
    service_data: ServiceCatalogCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create service catalog item"""
    return service.create_service_catalog_item(service_data)

@router.get("/service-catalog/{business_config_id}", response_model=List[ServiceCatalogResponse])
async def get_service_catalog(
    business_config_id: uuid.UUID,
    category: Optional[str] = Query(None, description="Filter by service category"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get service catalog for a business configuration"""
    return service.get_service_catalog(business_config_id, category)

# Bill of Materials endpoints (for manufacturing businesses)
@router.post("/bill-of-materials", response_model=BillOfMaterialsResponse)
async def create_bill_of_materials(
    bom_data: BillOfMaterialsCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create bill of materials"""
    return service.create_bill_of_materials(bom_data)

@router.get("/bill-of-materials/{business_config_id}", response_model=List[BillOfMaterialsResponse])
async def get_bills_of_materials(
    business_config_id: uuid.UUID,
    product_id: Optional[uuid.UUID] = Query(None, description="Filter by product ID"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get bills of materials for a business configuration"""
    return service.get_bills_of_materials(business_config_id, product_id)

# Production Tracking endpoints (for manufacturing businesses)
@router.post("/production-tracking", response_model=ProductionTrackingResponse)
async def create_production_tracking(
    tracking_data: ProductionTrackingCreate,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Create production tracking record"""
    return service.create_production_tracking(tracking_data)

@router.get("/production-tracking/{business_config_id}", response_model=List[ProductionTrackingResponse])
async def get_production_tracking(
    business_config_id: uuid.UUID,
    status: Optional[str] = Query(None, description="Filter by production status"),
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Get production tracking records for a business configuration"""
    return service.get_production_tracking(business_config_id, status)

# Business Type Detection and Setup endpoints
@router.post("/detect-business-type", response_model=BusinessTypeDetectionResponse)
async def detect_business_type(
    detection_request: BusinessTypeDetectionRequest,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Detect business type based on description and activities"""
    return service.detect_business_type(detection_request)

@router.post("/setup-wizard", response_model=BusinessTypeConfigurationResponse)
async def setup_business_wizard(
    setup_request: BusinessSetupWizardRequest,
    service: BusinessConfigurationService = Depends(get_business_config_service)
):
    """Set up business configuration using setup wizard"""
    try:
        return service.setup_business_wizard(setup_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Utility endpoints
@router.get("/business-types")
async def get_supported_business_types():
    """Get list of supported business types"""
    return {
        "business_types": [
            {"value": bt.value, "label": bt.value.replace("_", " ").title()}
            for bt in BusinessTypeEnum
        ]
    }

@router.get("/workflow-types")
async def get_supported_workflow_types():
    """Get list of supported workflow types"""
    return {
        "workflow_types": [
            {"value": wt.value, "label": wt.value.replace("_", " ").title()}
            for wt in WorkflowTypeEnum
        ]
    }

@router.get("/field-types")
async def get_supported_field_types():
    """Get list of supported custom field types"""
    return {
        "field_types": [
            {"value": ft.value, "label": ft.value.replace("_", " ").title()}
            for ft in FieldTypeEnum
        ]
    }